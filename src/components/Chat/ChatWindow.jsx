import { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'
import MessageBubble from './MessageBubble'
import GroupInfoPanel from '../Groups/GroupInfoPanel'
import ImagePreviewModal from './ImagePreviewModal'
import { uploadToCloudinary } from '../../utils/cloudinaryUpload'
import Icon from '../Common/Icon'

export default function ChatWindow() {
  const { currentUser, activeChat, setActiveChat, getMessages, sendMessage, messagesLoading, setActiveCall } = useStore()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [previewImage, setPreviewImage] = useState(null)

  const scrollContainerRef = useRef(null)
  const inputRef = useRef(null)
  const photoInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const timerRef = useRef(null)

  const messages = getMessages()

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
    setShowInfo(false)
  }, [activeChat?.id])

  const textPrimary  = theme.textPrimary  || '#1a1a1a'
  const textSecondary = theme.textSecondary || '#6b7280'
  const borderColor  = theme.borderColor  || '#e5e7eb'
  const headerBg     = theme.isDark ? (theme.cardBg || '#252525') : 'white'

  if (!activeChat) {
    if (isMobile) {
      return (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10,
          background: theme.chatBg,
          transform: 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }} />
      )
    }
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: theme.chatBg, gap: 16,
      }}>
        <Icon name="chat" fallback="💬" size={80} style={{ filter: 'grayscale(1) opacity(0.5)' }} />
        <h2 style={{ fontSize: 24, fontWeight: 700, color: textPrimary }}>LinePro</h2>
        <p style={{ color: textSecondary, fontSize: 15, textAlign: 'center', maxWidth: 280 }}>
          選擇一個對話開始聊天<br />或加好友建立新對話
        </p>
      </div>
    )
  }

  const chatName     = activeChat.type === 'dm' ? (activeChat.user.nickname || activeChat.user.name) : activeChat.group.name
  const chatSubtitle = activeChat.type === 'dm'
    ? (activeChat.user.statusMessage || (activeChat.user.status === 'online' ? '線上' : '離線'))
    : `${activeChat.group.members?.length || 0} 位成員`
  const chatAvatar   = activeChat.type === 'dm'
    ? activeChat.user
    : { name: activeChat.group.name, avatarColor: activeChat.group.avatarColor }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(input)
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      console.error('sendMessage failed:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePhotoSend = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPhoto(true)
    try {
      const mediaUrl = await uploadToCloudinary(file, 'chat-images')
      await sendMessage('', mediaUrl)
    } catch (err) {
      console.error('photo send failed:', err)
    } finally {
      setUploadingPhoto(false)
      e.target.value = ''
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        clearInterval(timerRef.current)
        setRecordingDuration(0)
        setIsRecording(false)
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' })
        stream.getTracks().forEach(t => t.stop())
        
        setSending(true)
        try {
          const mediaUrl = await uploadToCloudinary(file, 'chat-audio')
          await sendMessage('', mediaUrl)
        } catch (err) {
          console.error('audio send failed:', err)
        } finally {
          setSending(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration(d => d + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('無法存取麥克風，請確認權限')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        clearInterval(timerRef.current)
        setRecordingDuration(0)
        setIsRecording(false)
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
      }
      mediaRecorderRef.current.stop()
    }
  }

  const formatDuration = (s) => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ─── Build display list ───────────────────────────────────────────────────
  // Find the index of the last message sent by me (for 已讀 indicator)
  const lastMyMsgIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const senderId = messages[i].senderId?._id || messages[i].senderId
      if (senderId?.toString() === currentUser._id?.toString()) return i
    }
    return -1
  })()

  // Group messages by date
  const groupedMessages = []
  let lastDate = null
  messages.forEach((msg, idx) => {
    const d = new Date(msg.timestamp || msg.createdAt)
    const dateStr = d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
    if (dateStr !== lastDate) {
      groupedMessages.push({ type: 'date', date: dateStr })
      lastDate = dateStr
    }
    groupedMessages.push({ type: 'message', msg, originalIdx: idx })
  })

  // For DM: readCount = 1 if partner's id is in readBy
  // For group: readCount = number of members who read (excluding sender)
  const getReadCount = (msg) => {
    const readBy = msg.readBy || []
    if (activeChat.type === 'dm') {
      return readBy.some(id => id?.toString() === activeChat.id?.toString()) ? 1 : 0
    }
    // group — exclude sender
    const senderId = msg.senderId?._id || msg.senderId
    return readBy.filter(id => id?.toString() !== senderId?.toString()).length
  }

  const containerStyle = isMobile
    ? {
        position: 'fixed', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        background: theme.chatBg,
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease',
      }
    : { flex: 1, display: 'flex', flexDirection: 'column', background: theme.chatBg, overflow: 'hidden' }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 20px',
        background: headerBg,
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        {isMobile && (
          <button
            onClick={() => setActiveChat(null)}
            style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              background: theme.isDark ? '#2d2d2d' : '#f3f4f6',
              color: textPrimary, fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ←
          </button>
        )}
        <Avatar user={chatAvatar} size={42} showStatus={activeChat.type === 'dm'} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: textPrimary }}>{chatName}</div>
          <div style={{ fontSize: 12, color: textSecondary }}>{chatSubtitle}</div>
        </div>
        {activeChat.type === 'dm' && (
          <button
            onClick={() => setActiveCall({ partnerId: activeChat.id, partnerUser: activeChat.user, mode: 'calling' })}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: theme.isDark ? '#2d2d2d' : '#f3f4f6',
              color: textPrimary, fontSize: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            title="視訊通話"
          >
            <Icon name="video_call" fallback="📹" size={24} style={{ filter: theme.isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
          </button>
        )}
        {activeChat.type === 'group' && (
          <button
            onClick={() => setShowInfo(true)}
            style={{
              padding: '8px 14px', borderRadius: 10,
              background: theme.isDark ? '#2d2d2d' : '#f3f4f6',
              color: textPrimary, fontSize: 13, fontWeight: 600,
            }}
          >
            群組資訊
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px', overscrollBehaviorY: 'contain' }}
      >
        {messagesLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textSecondary, fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Icon name="loading" fallback="⏳" size={24} className="animate-spin" style={{ filter: 'grayscale(1) opacity(0.5)' }} />
            載入訊息中...
          </div>
        )}
        {!messagesLoading && groupedMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textSecondary, fontSize: 14 }}>
            <div style={{ marginBottom: 8 }}><Icon name="wave" fallback="👋" size={40} /></div>
            傳送第一則訊息開始聊天吧！
          </div>
        )}

        {groupedMessages.map((item, i) => {
          if (item.type === 'date') {
            return (
              <div key={i} style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: 20,
                  background: theme.isDark ? '#333' : '#e5e7eb',
                  fontSize: 12, color: textSecondary,
                }}>
                  {item.date}
                </span>
              </div>
            )
          }

          const { msg, originalIdx } = item
          const senderId    = msg.senderId?._id || msg.senderId
          const isMe        = senderId?.toString() === currentUser._id?.toString()
          const isLastMyMsg = isMe && originalIdx === lastMyMsgIndex

          return (
            <MessageBubble
              key={msg._id || msg.id || i}
              msg={msg}
              sender={typeof msg.senderId === 'object' ? msg.senderId : null}
              isMe={isMe}
              showAvatar={activeChat.type === 'group'}
              isLastMyMsg={isLastMyMsg}
              readCount={isLastMyMsg ? getReadCount(msg) : 0}
              onImageClick={setPreviewImage}
            />
          )
        })}
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 20px',
        background: headerBg,
        borderTop: `1px solid ${borderColor}`,
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handlePhotoSend}
        />
        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto || sending || isRecording}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: theme.isDark ? '#2d2d2d' : '#f3f4f6',
            color: textPrimary, fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {uploadingPhoto ? <Icon name="loading" fallback="⏳" size={20} className="animate-spin" /> : <Icon name="camera" fallback="📷" size={20} style={{ filter: theme.isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} />}
        </button>

        {isRecording ? (
          <div style={{
            flex: 1, padding: '11px 16px', borderRadius: 24,
            background: theme.isDark ? '#2d2d2d' : '#f9fafb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: `1.5px solid ${theme.primary}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
              錄音中... {formatDuration(recordingDuration)}
            </div>
            <button onClick={cancelRecording} style={{ color: textSecondary, fontSize: 13, background: 'none' }}>取消</button>
          </div>
        ) : (
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`傳訊息給 ${chatName}...`}
            rows={1}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 24,
              border: `1.5px solid ${borderColor}`,
              background: theme.isDark ? '#2d2d2d' : 'white',
              color: textPrimary,
              fontSize: 15, resize: 'none', maxHeight: 120,
              overflowY: 'auto', lineHeight: '1.5',
              fontFamily: 'inherit', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = theme.inputFocus}
            onBlur={e => e.target.style.borderColor = borderColor}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
        )}
        
        <button
          onClick={isRecording ? stopRecording : (!input.trim() ? startRecording : handleSend)}
          disabled={uploadingPhoto || (sending && !isRecording)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: (input.trim() && !sending) || isRecording ? theme.buttonPrimary : (theme.isDark ? '#333' : '#e5e7eb'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
          }}
        >
          {sending && !isRecording 
            ? <Icon name="loading" fallback="⏳" size={20} className="animate-spin" style={{ filter: 'brightness(0) invert(1)' }} /> 
            : isRecording 
              ? <Icon name="send_audio" fallback="⬆️" size={20} style={{ filter: 'brightness(0) invert(1)' }} /> 
              : (!input.trim() 
                ? <Icon name="mic" fallback="🎤" size={20} style={{ filter: 'brightness(0) invert(1)' }} /> 
                : <Icon name="send" fallback="➤" size={20} style={{ filter: 'brightness(0) invert(1)' }} />)}
        </button>
      </div>

      {showInfo && activeChat.type === 'group' && (
        <GroupInfoPanel group={activeChat.group} onClose={() => setShowInfo(false)} />
      )}

      {previewImage && (
        <ImagePreviewModal url={previewImage.url} type={previewImage.type} onClose={() => setPreviewImage(null)} />
      )}
    </div>
  )
}
