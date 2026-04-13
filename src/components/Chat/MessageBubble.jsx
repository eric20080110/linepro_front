import { useState, useRef, useEffect } from 'react'
import Avatar from '../Common/Avatar'
import { useTheme } from '../../theme/ThemeContext'
import useStore from '../../store/useStore'
import useIsMobile from '../../hooks/useIsMobile'
import Icon from '../Common/Icon'
import { format } from 'date-fns'

const REACTION_EMOJIS = ['❤️', '😭', '😂', '😡', '👍']

export default function MessageBubble({ msg, sender, isMe, showAvatar, isLastMyMsg, readCount, onImageClick }) {
  const theme = useTheme()
  const isMobile = useIsMobile()
  const { jumpToMessage, setReplyingTo, recallMessage, pinMessage, reactToMessage, currentUser } = useStore()
  
  const [showMenu, setShowMenu] = useState(false)
  const [swipeOffset, setSwipeY] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  
  const menuRef = useRef(null)
  const startX = useRef(0)

  const time = format(new Date(msg.timestamp || msg.createdAt), 'HH:mm')
  const isVideo = msg.mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i) && !msg.mediaUrl?.includes('chat-audio')
  const isAudio = msg.mediaUrl?.includes('chat-audio')

  const bubbleOtherBg     = theme.isDark ? (theme.bubbleOther   || '#2d2d2d') : 'white'
  const bubbleOtherText   = theme.isDark ? (theme.bubbleOtherText || '#f0f0f0') : '#1a1a1a'
  const bubbleOtherBorder = theme.isDark ? (theme.bubbleOtherBorder || '#3a3a3a') : '#e5e7eb'

  // Close menu on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMenu])

  // --- Mobile Swipe Handlers ---
  const handleTouchStart = (e) => {
    if (msg.isRecalled) return
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
  }

  const handleTouchMove = (e) => {
    if (!isSwiping) return
    const diff = e.touches[0].clientX - startX.current
    // Swipe towards center: if isMe (right), swipe left (negative). If !isMe (left), swipe right (positive).
    const offset = isMe ? Math.min(0, Math.max(diff, -60)) : Math.max(0, Math.min(diff, 60))
    setSwipeY(offset)
  }

  const handleTouchEnd = () => {
    if (Math.abs(swipeOffset) >= 50) {
      setReplyingTo(msg)
      if (window.navigator.vibrate) window.navigator.vibrate(10)
    }
    setSwipeY(0)
    setIsSwiping(false)
  }

  // --- Long Press Logic ---
  const timer = useRef(null)
  const handlePressStart = () => {
    if (!isMobile || msg.isRecalled) return
    timer.current = setTimeout(() => {
      setShowMenu(true)
      if (window.navigator.vibrate) window.navigator.vibrate(20)
    }, 500)
  }
  const handlePressEnd = () => clearTimeout(timer.current)

  const groupReactions = () => {
    const counts = {}
    ;(msg.reactions || []).forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1
    })
    return Object.entries(counts)
  }

  if (msg.isRecalled) {
    return (
      <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', padding: '4px 16px', marginBottom: 4 }}>
        <div style={{
          padding: '8px 12px', borderRadius: 16, fontSize: 13,
          background: theme.isDark ? '#222' : '#f3f4f6', color: '#9ca3af', fontStyle: 'italic',
          border: `1px solid ${theme.isDark ? '#333' : '#e5e7eb'}`,
        }}>訊息已收回</div>
      </div>
    )
  }

  return (
    <div 
      id={`msg-${msg._id}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      style={{
        display: 'flex',
        flexDirection: isMe ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: isLastMyMsg ? 4 : 12,
        padding: '4px 16px',
        position: 'relative',
        transform: `translateX(${swipeOffset}px)`,
        transition: isSwiping ? 'none' : 'transform 0.2s',
      }}
    >
      {/* Swipe Indicator */}
      {Math.abs(swipeOffset) > 20 && (
        <div style={{
          position: 'absolute', [isMe ? 'right' : 'left']: -30, top: '50%', transform: 'translateY(-50%)',
          opacity: Math.abs(swipeOffset) / 60, fontSize: 18
        }}>↩️</div>
      )}

      {showAvatar && !isMe && <Avatar user={sender} size={32} />}
      {showAvatar && isMe  && <div style={{ width: 32 }} />}

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
        maxWidth: '75%',
        position: 'relative'
      }}>
        {showAvatar && !isMe && (
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 3, paddingLeft: 4 }}>
            {sender?.nickname || sender?.name}
          </div>
        )}

        {/* Reply Context */}
        {msg.replyTo && (
          <div 
            onClick={() => jumpToMessage(msg.replyToId)}
            style={{
              padding: '6px 10px', borderRadius: 12, background: 'rgba(0,0,0,0.05)',
              fontSize: 12, color: '#888', marginBottom: -8, paddingBottom: 12,
              borderLeft: `3px solid ${theme.primary}`, cursor: 'pointer', maxWidth: '100%',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 11, color: theme.primary }}>{msg.replyTo.senderName}</div>
            {msg.replyTo.text}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}>
          {/* Bubble */}
          <div 
            onContextMenu={(e) => { e.preventDefault(); setShowMenu(true) }}
            style={{
              padding: msg.mediaUrl && !msg.text ? 4 : '10px 14px',
              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: isMe ? theme.bubbleMe : bubbleOtherBg,
              color: isMe ? theme.bubbleMeText : bubbleOtherText,
              fontSize: 15,
              lineHeight: '1.5',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              border: isMe ? 'none' : `1px solid ${bubbleOtherBorder}`,
              position: 'relative'
            }}
          >
            {msg.mediaUrl && (
              isAudio ? (
                <audio controls src={msg.mediaUrl} style={{ display: 'block', maxWidth: 200 }} />
              ) : isVideo ? (
                <div onClick={() => onImageClick && onImageClick({ url: msg.mediaUrl, type: 'video' })} style={{ cursor: 'zoom-in' }}>
                  <video src={msg.mediaUrl} style={{ display: 'block', maxWidth: 260, maxHeight: 280, borderRadius: 10, objectFit: 'cover', pointerEvents: 'none' }} />
                </div>
              ) : (
                <div onClick={() => onImageClick && onImageClick({ url: msg.mediaUrl, type: 'image' })} style={{ cursor: 'zoom-in' }}>
                  <img src={msg.mediaUrl} alt="media" style={{ display: 'block', maxWidth: 260, maxHeight: 280, borderRadius: 10, objectFit: 'cover' }} />
                </div>
              )
            )}
            {msg.text && (
              <span style={{ display: 'block', padding: msg.mediaUrl ? '8px 10px 6px' : 0 }}>
                {msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => part.match(/^https?:\/\/[^\s]+$/) ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: isMe ? '#fff' : (theme.primary || '#06C755'), textDecoration: 'underline', wordBreak: 'break-all' }} onClick={e => e.stopPropagation()}>{part}</a> : part)}
              </span>
            )}

            {/* Reactions Display */}
            {msg.reactions?.length > 0 && (
              <div style={{
                position: 'absolute', bottom: -10, [isMe ? 'left' : 'right']: -4,
                display: 'flex', gap: 2, background: 'white', borderRadius: 12,
                padding: '2px 6px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                border: '1px solid #eee', zIndex: 2
              }}>
                {groupReactions().map(([emoji, count]) => (
                  <span key={emoji} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {emoji} {count > 1 && <span style={{ fontSize: 10, color: '#666', fontWeight: 700 }}>{count}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Context Menu (Desktop Three Dots / Triggered by Right Click or Long Press) */}
          {!isMobile && !showMenu && (
            <button 
              className="msg-more-btn"
              onClick={() => setShowMenu(true)}
              style={{
                background: 'none', color: '#9ca3af', opacity: 0, 
                transition: 'opacity 0.2s', padding: 4, cursor: 'pointer'
              }}
            >⋮</button>
          )}

          {/* Time & Read Status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{time}</div>
            {isMe && isLastMyMsg && (
              <div style={{ fontSize: 11, color: readCount > 0 ? theme.primary : '#9ca3af', fontWeight: readCount > 0 ? 600 : 400 }}>
                {readCount > 0 ? (showAvatar ? `已讀 ${readCount}` : '已讀') : '已傳送'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Menu & Emoji Bar */}
      {showMenu && (
        <div 
          ref={menuRef}
          style={{
            position: 'absolute', top: isMobile ? '50%' : 'auto', left: isMobile ? '50%' : (isMe ? 'auto' : '100%'),
            right: isMe && !isMobile ? '100%' : 'auto',
            transform: isMobile ? 'translate(-50%, -50%)' : 'none',
            zIndex: 100, background: theme.isDark ? '#2d2d2d' : 'white',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            padding: 8, minWidth: 160, border: `1px solid ${theme.isDark ? '#444' : '#eee'}`
          }}
        >
          {/* Emoji Bar */}
          <div style={{ display: 'flex', gap: 10, padding: '4px 8px 12px', borderBottom: `1px solid ${theme.isDark ? '#444' : '#eee'}`, marginBottom: 8, justifyContent: 'center' }}>
            {REACTION_EMOJIS.map(emoji => (
              <button 
                key={emoji} 
                onClick={() => { reactToMessage(msg._id, emoji); setShowMenu(false) }}
                style={{ fontSize: 20, background: 'none', transition: 'transform 0.1s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.3)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
              >{emoji}</button>
            ))}
          </div>
          {/* Options */}
          <MenuOption label="回覆" icon="↩️" onClick={() => { setReplyingTo(msg); setShowMenu(false) }} />
          <MenuOption label={msg.isPinned ? "取消釘選" : "釘選"} icon="📌" onClick={() => { pinMessage(msg._id, !msg.isPinned); setShowMenu(false) }} />
          {isMe && <MenuOption label="收回" icon="🗑️" color="#ef4444" onClick={() => { recallMessage(msg._id); setShowMenu(false) }} />}
        </div>
      )}

      {/* Global CSS for hover */}
      <style>{`.msg-more-btn { display: inline-block; } div:hover > div > div > .msg-more-btn { opacity: 1 !important; }`}</style>
    </div>
  )
}

function MenuOption({ label, icon, onClick, color, theme }) {
  return (
    <button 
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px', borderRadius: 8, background: 'none',
        textAlign: 'left', color: color || 'inherit', fontSize: 14, fontWeight: 500
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  )
}
