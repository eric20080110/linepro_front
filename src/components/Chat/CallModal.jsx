import { useEffect, useRef, useState, useCallback } from 'react'
import useStore from '../../store/useStore'
import Avatar from '../Common/Avatar'
import Icon from '../Common/Icon'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export default function CallModal({ mode, partnerId, partnerUser, offer, callType = 'video', onClose }) {
  const socket = useStore(s => s.socket)
  const currentUser = useStore(s => s.currentUser)

  // status: 'ringing' | 'connecting' | 'active'
  const [status, setStatus] = useState('ringing')
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(false)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)

  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  // Always-mounted refs (avoid ontrack race condition with conditional rendering)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const iceQueueRef = useRef([])
  const remoteDescSetRef = useRef(false)

  // ── Helper: assign remote stream to correct media element ─────────────────
  const applyRemoteStream = useCallback((stream) => {
    const videoTracks = stream.getVideoTracks()
    const hasVideoTracks = videoTracks.length > 0

    // Track mute state: if track exists but is muted/disabled, treat as no video
    const isVideoActive = hasVideoTracks && videoTracks.some(t => !t.muted && t.enabled)
    setHasRemoteVideo(isVideoActive)

    // Listen for mute/unmute on video tracks to update avatar visibility
    videoTracks.forEach(track => {
      track.onmute = () => setHasRemoteVideo(false)
      track.onunmute = () => setHasRemoteVideo(true)
    })

    if (hasVideoTracks) {
      // Video stream: video element handles both audio + video
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream
        remoteVideoRef.current.play().catch(() => {})
      }
      // Clear audio element to prevent double audio playback
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null
    } else {
      // Audio-only stream: use dedicated audio element
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream
        remoteAudioRef.current.play().catch(() => {})
      }
    }

    setStatus('active')
  }, [])

  // ── Helper: set remote description then flush ICE queue ──────────────────
  const setRemoteDesc = useCallback(async (desc) => {
    const pc = pcRef.current
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription(desc))
    remoteDescSetRef.current = true
    for (const c of iceQueueRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
    }
    iceQueueRef.current = []
  }, [])

  // ── Helper: hangup (reads refs, safe from closure issues) ────────────────
  const hangup = useCallback((notifyRemote = true) => {
    if (notifyRemote) socket?.emit('call_end', { targetId: partnerId })
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    onClose()
  }, [socket, partnerId, onClose])

  // ── Helper: build a new RTCPeerConnection with shared handlers ───────────
  const buildPC = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket?.emit('ice_candidate', { targetId: partnerId, candidate: e.candidate })
      }
    }

    pc.ontrack = (e) => {
      // e.streams[0] can be undefined in some browsers — fall back to wrapping the track
      const stream = e.streams[0] || new MediaStream([e.track])
      applyRemoteStream(stream)
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        hangup(false)
      }
    }

    return pc
  }, [socket, partnerId, hangup, applyRemoteStream])

  // ── Caller flow ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'calling') return

    let cancelled = false

    async function startCall() {
      const constraints = { audio: true, video: callType === 'video' }
      let localStream
      try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch {
        alert('無法存取攝影機或麥克風，請確認權限')
        onClose()
        return
      }
      if (cancelled) { localStream.getTracks().forEach(t => t.stop()); return }

      localStreamRef.current = localStream
      // localVideoRef is always in DOM — safe to set directly
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = localStream
      }

      const pc = buildPC()
      pcRef.current = pc
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

      const rtcOffer = await pc.createOffer()
      await pc.setLocalDescription(rtcOffer)

      socket?.emit('call_offer', {
        targetId: partnerId,
        offer: { type: rtcOffer.type, sdp: rtcOffer.sdp },
        callerId: currentUser?._id,
        callerName: currentUser?.nickname || currentUser?.name,
        callType,
      })

      setStatus('ringing')
    }

    startCall().catch(err => {
      console.error('startCall failed:', err)
      if (!cancelled) onClose()
    })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Socket listeners ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleAnswered = async ({ answer }) => {
      if (!pcRef.current) return
      setStatus('connecting')
      await setRemoteDesc(answer)
    }

    const handleIce = ({ candidate }) => {
      if (!candidate) return
      if (remoteDescSetRef.current && pcRef.current) {
        pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {})
      } else {
        iceQueueRef.current.push(candidate)
      }
    }

    const handleEnded = () => hangup(false)

    socket.on('call_answered', handleAnswered)
    socket.on('ice_candidate', handleIce)
    socket.on('call_ended', handleEnded)

    return () => {
      socket.off('call_answered', handleAnswered)
      socket.off('ice_candidate', handleIce)
      socket.off('call_ended', handleEnded)
    }
  }, [socket, setRemoteDesc, hangup])

  // ── Incoming: accept ──────────────────────────────────────────────────────
  const acceptCall = async () => {
    setStatus('connecting')
    const constraints = { audio: true, video: callType === 'video' }
    let localStream
    try {
      localStream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch {
      alert('接聽失敗，請確認權限')
      hangup(false)
      return
    }

    localStreamRef.current = localStream
    if (localVideoRef.current && callType === 'video') {
      localVideoRef.current.srcObject = localStream
    }

    const pc = buildPC()
    pcRef.current = pc
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

    // Set remote first, flush any queued ICE, then answer
    await setRemoteDesc(offer)

    const rtcAnswer = await pc.createAnswer()
    await pc.setLocalDescription(rtcAnswer)

    socket?.emit('call_answer', {
      callerId: partnerId,
      answer: { type: rtcAnswer.type, sdp: rtcAnswer.sdp },
    })
  }

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute = () => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMuted(m => !m)
  }

  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setVideoOff(v => !v)
  }

  const isVideo = callType === 'video'
  const isIncomingRinging = mode === 'incoming' && status === 'ringing'
  const showRemoteVideo = isVideo && hasRemoteVideo

  const statusText = {
    ringing: mode === 'calling' ? '撥打中...' : (isVideo ? '視訊來電' : '語音來電'),
    connecting: '連線中...',
    active: '通話中',
  }[status]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Audio element for voice calls (hidden, always mounted) */}
      <audio ref={remoteAudioRef} autoPlay style={{ display: 'none' }} />

      {/* Remote video — always in DOM so ontrack can set srcObject without race condition */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'contain',
          display: showRemoteVideo ? 'block' : 'none',
        }}
      />

      {/* Avatar + name — shown whenever remote video is absent (voice call / waiting / no camera) */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        color: 'white', position: 'relative', zIndex: 1,
        opacity: showRemoteVideo ? 0 : 1,
        pointerEvents: 'none',
      }}>
        <Avatar user={partnerUser} size={100} />
        <div style={{ fontSize: 22, fontWeight: 700 }}>{partnerUser?.nickname || partnerUser?.name}</div>
        <div style={{ fontSize: 15, color: '#aaa' }}>{statusText}</div>
      </div>

      {/* Local video PiP — always in DOM, visible only during video calls after ringing */}
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
          display: (isVideo && status !== 'ringing' && !videoOff) ? 'block' : 'none',
        }}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: 48,
        display: 'flex', gap: 24, zIndex: 3,
        alignItems: 'center',
      }}>
        {isIncomingRinging ? (
          <>
            <ControlBtn color="#22c55e" label="接聽" onClick={acceptCall}>
              <Icon name="call" fallback="📞" size={26} style={{ filter: 'brightness(0) invert(1)' }} />
            </ControlBtn>
            <ControlBtn color="#ef4444" label="拒絕" onClick={() => {
              socket?.emit('call_rejected', { callerId: partnerId })
              hangup(false)
            }}>
              <Icon name="close" fallback="✕" size={26} style={{ filter: 'brightness(0) invert(1)' }} />
            </ControlBtn>
          </>
        ) : (
          <>
            <ControlBtn color={muted ? '#555' : '#333'} label={muted ? '取消靜音' : '靜音'} onClick={toggleMute}>
              <Icon
                name={muted ? 'mic_off' : 'mic'}
                fallback={muted ? '🔇' : '🎤'}
                size={24}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </ControlBtn>

            <ControlBtn color="#ef4444" label="掛斷" onClick={() => hangup(true)} size={64}>
              <Icon name="call_end" fallback="📵" size={28} style={{ filter: 'brightness(0) invert(1)' }} />
            </ControlBtn>

            {isVideo && (
              <ControlBtn color={videoOff ? '#555' : '#333'} label={videoOff ? '開鏡頭' : '關鏡頭'} onClick={toggleVideo}>
                <Icon
                  name={videoOff ? 'videocam_off' : 'videocam'}
                  fallback={videoOff ? '📷' : '🎥'}
                  size={24}
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </ControlBtn>
            )}
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
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2, border: 'none', cursor: 'pointer',
      }}
    >
      {children}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)' }}>{label}</span>
    </button>
  )
}
