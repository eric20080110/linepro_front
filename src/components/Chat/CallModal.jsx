import { useEffect, useRef, useState } from 'react'
import useStore from '../../store/useStore'
import Avatar from '../Common/Avatar'
import Icon from '../Common/Icon'

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export default function CallModal({ mode, partnerId, partnerUser, offer, onClose }) {
  const socket = useStore(s => s.socket)
  const [remoteStream, setRemoteStream] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [status, setStatus] = useState(mode === 'calling' ? '撥打中...' : '來電中...')

  const pcRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    let pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc
    const iceQueue = []

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0])
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0]
      setStatus('通話中')
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('ice_candidate', { targetId: partnerId, candidate: e.candidate })
      }
    }

    // Socket event handlers
    const handleAnswered = async ({ answer }) => {
      if (pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        setStatus('通話中')
      }
    }
    
    const handleIce = async ({ candidate }) => {
      if (!candidate) return
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
      } else {
        iceQueue.push(candidate)
      }
    }
    
    const handleEnded = () => hangup(false)

    socket?.on('call_answered', handleAnswered)
    socket?.on('ice_candidate', handleIce)
    socket?.on('call_ended', handleEnded)

    async function setupCall() {
      if (mode === 'calling') {
        const localStr = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        setLocalStream(localStr)
        if (localVideoRef.current) localVideoRef.current.srcObject = localStr

        localStr.getTracks().forEach(track => pc.addTrack(track, localStr))

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        socket?.emit('call_offer', {
          targetId: partnerId,
          offer,
          callerId: useStore.getState().currentUser?._id,
          callerName: useStore.getState().currentUser?.nickname || useStore.getState().currentUser?.name,
        })
      } else {
        // incoming
        await pc.setRemoteDescription(new RTCSessionDescription(offer))
        for (const cand of iceQueue) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {})
        }
        iceQueue.length = 0
      }
    }

    setupCall().catch(err => {
      console.error('call setup failed:', err)
      onClose()
    })

    return () => {
      socket?.off('call_answered', handleAnswered)
      socket?.off('ice_candidate', handleIce)
      socket?.off('call_ended', handleEnded)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function hangup(notifyRemote = true) {
    if (notifyRemote) socket?.emit('call_end', { targetId: partnerId })
    pcRef.current?.close()
    localStream?.getTracks().forEach(t => t.stop())
    onClose()
  }

  function toggleMute() {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMuted(m => !m)
  }

  function toggleVideo() {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setVideoOff(v => !v)
  }

  // Incoming call — accept
  const acceptCall = async () => {
    setStatus('連線中...')
    try {
      const localStr = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      setLocalStream(localStr)
      if (localVideoRef.current) localVideoRef.current.srcObject = localStr

      const pc = pcRef.current
      localStr.getTracks().forEach(track => pc.addTrack(track, localStr))

      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket?.emit('call_answer', { callerId: partnerId, answer })
      setStatus('通話中')
    } catch (err) {
      console.error('Failed to accept call:', err)
      hangup()
    }
  }

  const isIncoming = mode === 'incoming' && status === '來電中...'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Remote video — full background */}
      {remoteStream ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          color: 'white', position: 'relative', zIndex: 1,
        }}>
          <Avatar user={partnerUser} size={100} />
          <div style={{ fontSize: 22, fontWeight: 700 }}>{partnerUser?.nickname || partnerUser?.name}</div>
          <div style={{ fontSize: 15, color: '#aaa' }}>{status}</div>
        </div>
      )}

      {/* Local video PiP */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 100, height: 140,
          borderRadius: 12, objectFit: 'cover',
          border: '2px solid rgba(255,255,255,0.3)',
          zIndex: 2,
          display: videoOff ? 'none' : 'block',
        }}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 40,
        display: 'flex', gap: 20, zIndex: 3,
        alignItems: 'center',
      }}>
        {isIncoming ? (
          <>
            <ControlBtn color="#22c55e" label="接聽" onClick={acceptCall}>
              <Icon name="call" fallback="📞" size={24} style={{ filter: 'brightness(0) invert(1)' }} />
            </ControlBtn>
            <ControlBtn color="#ef4444" label="拒絕" onClick={() => {
              socket?.emit('call_rejected', { callerId: partnerId })
              hangup(false)
            }}>
              <Icon name="close" fallback="❌" size={24} style={{ filter: 'brightness(0) invert(1)' }} />
            </ControlBtn>
          </>
        ) : (
          <>
            <ControlBtn color={muted ? '#555' : '#333'} label={muted ? '取消靜音' : '靜音'} onClick={toggleMute}>
              {muted ? <Icon name="mic_off" fallback="🔇" size={24} style={{ filter: 'brightness(0) invert(1)' }} /> : <Icon name="mic" fallback="🎤" size={24} style={{ filter: 'brightness(0) invert(1)' }} />}
            </ControlBtn>
            <ControlBtn color="#ef4444" label="掛斷" onClick={() => hangup(true)} size={64}>
              <Icon name="call_end" fallback="📵" size={28} style={{ filter: 'brightness(0) invert(1)' }} />
            </ControlBtn>
            <ControlBtn color={videoOff ? '#555' : '#333'} label={videoOff ? '開啟鏡頭' : '關閉鏡頭'} onClick={toggleVideo}>
              {videoOff ? <Icon name="videocam_off" fallback="📷" size={24} style={{ filter: 'brightness(0) invert(1)' }} /> : <Icon name="videocam" fallback="🎥" size={24} style={{ filter: 'brightness(0) invert(1)' }} />}
            </ControlBtn>
          </>
        )}
      </div>
    </div>
  )
}

function ControlBtn({ color, label, onClick, children, size = 56 }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: '50%',
        background: color, color: 'white',
        fontSize: size * 0.4,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2,
      }}
    >
      {children}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
    </button>
  )
}
