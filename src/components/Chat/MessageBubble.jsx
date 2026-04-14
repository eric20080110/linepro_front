import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Avatar from '../Common/Avatar'
import Icon from '../Common/Icon'
import { useTheme } from '../../theme/ThemeContext'
import useStore from '../../store/useStore'
import useIsMobile from '../../hooks/useIsMobile'
import { format } from 'date-fns'

const REACTION_EMOJIS = ['❤️', '😭', '😂', '😡', '👍']

export default function MessageBubble({ msg, sender, isMe, showAvatar, isLastMyMsg, readCount, onImageClick }) {
  const theme = useTheme()
  const isMobile = useIsMobile()
  const { jumpToMessage, setReplyingTo, recallMessage, pinMessage, reactToMessage } = useStore()

  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 'auto', right: 'auto', centerX: false })
  const [isHovered, setIsHovered] = useState(false)
  const [swipeOffset, setSwipeY] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)

  const menuRef = useRef(null)
  const dotsRef = useRef(null)
  const startX = useRef(0)
  const touchPos = useRef({ x: 0, y: 0 })
  const longPressTimer = useRef(null)

  const time = format(new Date(msg.timestamp || msg.createdAt), 'HH:mm')
  const isVideo = msg.mediaUrl?.match(/\.(mp4|webm|ogg|mov)$/i) && !msg.mediaUrl?.includes('chat-audio')
  const isAudio = msg.mediaUrl?.includes('chat-audio')

  const bubbleOtherBg     = theme.isDark ? (theme.bubbleOther   || '#2d2d2d') : 'white'
  const bubbleOtherText   = theme.isDark ? (theme.bubbleOtherText || '#f0f0f0') : '#1a1a1a'
  const bubbleOtherBorder = theme.isDark ? (theme.bubbleOtherBorder || '#3a3a3a') : '#e5e7eb'

  // Close menu on outside click/touch
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          dotsRef.current && !dotsRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [showMenu])

  // ── Mobile Swipe ──────────────────────────────────────────────────────────
  const handleTouchStart = (e) => {
    if (msg.isRecalled) return
    touchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    startX.current = e.touches[0].clientX
    setIsSwiping(true)
    // Start long press timer from touch position
    longPressTimer.current = setTimeout(() => {
      const menuHeight = 195
      const y = touchPos.current.y
      const top = Math.max(8, Math.min(y - menuHeight / 2, window.innerHeight - menuHeight - 8))
      setMenuPos({ top, left: '50%', right: 'auto', centerX: true })
      setShowMenu(true)
      if (window.navigator.vibrate) window.navigator.vibrate(20)
    }, 500)
  }
  const handleTouchMove = (e) => {
    if (!isSwiping) return
    const diff = e.touches[0].clientX - startX.current
    if (Math.abs(diff) > 10) clearTimeout(longPressTimer.current)
    const offset = isMe ? Math.min(0, Math.max(diff, -60)) : Math.max(0, Math.min(diff, 60))
    setSwipeY(offset)
  }
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current)
    if (Math.abs(swipeOffset) >= 50) {
      setReplyingTo(msg)
      if (window.navigator.vibrate) window.navigator.vibrate(10)
    }
    setSwipeY(0)
    setIsSwiping(false)
  }

  // ── Desktop three-dots click ──────────────────────────────────────────────
  const handleDotsClick = (e) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const menuHeight = 260

    // Vertically center menu on the dots button
    const idealTop = rect.top + rect.height / 2 - menuHeight / 2
    const top = Math.max(8, Math.min(idealTop, window.innerHeight - menuHeight - 8))

    let left, right
    if (isMe) {
      // My msgs: dots are left of bubble → menu appears further left
      right = window.innerWidth - rect.left + 4
      left = 'auto'
    } else {
      // Other msgs: dots are right of bubble → menu appears further right
      left = rect.right + 4
      right = 'auto'
    }
    setMenuPos({ top, left, right, centerX: false })
    setShowMenu(s => !s)
  }

  // ── Right-click context menu ──────────────────────────────────────────────
  const handleContextMenu = (e) => {
    e.preventDefault()
    const menuHeight = 260
    const menuWidth = 200
    const idealTop = e.clientY - menuHeight / 2
    const top = Math.max(8, Math.min(idealTop, window.innerHeight - menuHeight - 8))
    const left = isMe
      ? Math.max(8, e.clientX - menuWidth)
      : Math.min(e.clientX, window.innerWidth - menuWidth - 8)
    setMenuPos({ top, left, right: 'auto', centerX: false })
    setShowMenu(true)
  }

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

  const accentColor = msg.replyTo?.senderColor || theme.primary || '#06C755'

  // Portal menu — renders at document.body, above ALL stacking contexts
  const menuPortal = showMenu ? createPortal(
    <>
      {/* Tap-outside backdrop (mobile + desktop) */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
        onMouseDown={() => setShowMenu(false)}
        onTouchStart={() => setShowMenu(false)}
      />
      <div
        ref={menuRef}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      onTouchStart={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: menuPos.top,
        left: menuPos.centerX ? '50%' : menuPos.left,
        right: menuPos.centerX ? 'auto' : menuPos.right,
        transform: menuPos.centerX ? 'translateX(-50%)' : 'none',
        zIndex: 99999,
        background: theme.isDark ? (theme.cardBg || '#2d2d2d') : 'white',
        borderRadius: 14,
        boxShadow: '0 12px 48px rgba(0,0,0,0.28)',
        padding: isMobile ? '6px 4px' : '10px 6px',
        minWidth: isMobile ? 158 : 194,
        border: `1px solid ${theme.isDark ? '#444' : '#eee'}`,
      }}
    >
      {/* Emoji bar */}
      <div style={{
        display: 'flex', gap: isMobile ? 4 : 8,
        padding: isMobile ? '2px 6px 6px' : '2px 8px 10px',
        borderBottom: `1px solid ${theme.isDark ? '#444' : '#eee'}`,
        marginBottom: 2, justifyContent: 'center',
      }}>
        {REACTION_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { reactToMessage(msg._id, emoji); setShowMenu(false) }}
            style={{
              fontSize: isMobile ? 19 : 23, background: 'none', cursor: 'pointer',
              transition: 'transform 0.1s', padding: 2, border: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.35)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          >{emoji}</button>
        ))}
      </div>

      <MenuOption label="回覆訊息" icon="↩️" onClick={() => { setReplyingTo(msg); setShowMenu(false) }} theme={theme} isMobile={isMobile} />
      {msg.text && (
        <MenuOption label="複製訊息" icon="📋" onClick={() => { navigator.clipboard?.writeText(msg.text); setShowMenu(false) }} theme={theme} isMobile={isMobile} />
      )}
      <MenuOption label={msg.isPinned ? '取消釘選' : '釘選訊息'} icon="📌" onClick={() => { pinMessage(msg._id, !msg.isPinned); setShowMenu(false) }} theme={theme} isMobile={isMobile} />
      {isMe && (
        <MenuOption label="收回訊息" icon="🗑️" color="#ef4444" onClick={() => { recallMessage(msg._id); setShowMenu(false) }} theme={theme} isMobile={isMobile} />
      )}
    </div>
    </>,
    document.body
  ) : null

  return (
    <>
      <div
        id={`msg-${msg._id}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
          userSelect: isMobile ? 'none' : 'auto',
          WebkitUserSelect: isMobile ? 'none' : 'auto',
          WebkitTouchCallout: 'none',
        }}
      >
        {/* Swipe indicator */}
        {Math.abs(swipeOffset) > 20 && (
          <div style={{
            position: 'absolute', [isMe ? 'right' : 'left']: -30, top: '50%',
            transform: 'translateY(-50%)', opacity: Math.abs(swipeOffset) / 60, fontSize: 18,
          }}>↩️</div>
        )}

        {showAvatar && !isMe && <Avatar user={sender} size={32} />}
        {showAvatar && isMe  && <div style={{ width: 32 }} />}

        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: isMe ? 'flex-end' : 'flex-start',
          maxWidth: '75%', position: 'relative',
        }}>
          {showAvatar && !isMe && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 3, paddingLeft: 4 }}>
              {sender?.nickname || sender?.name}
            </div>
          )}

          {/* Hover wrapper: covers bubble + dots button only */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, flexDirection: isMe ? 'row-reverse' : 'row' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* ── Bubble ──────────────────────────────────────────────── */}
            <div
              onContextMenu={handleContextMenu}
              style={{
                padding: msg.mediaUrl && !msg.text && !msg.replyTo ? 4 : '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? theme.bubbleMe : bubbleOtherBg,
                color: isMe ? theme.bubbleMeText : bubbleOtherText,
                fontSize: 15, lineHeight: '1.5',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                border: isMe ? 'none' : `1px solid ${bubbleOtherBorder}`,
                position: 'relative',
              }}
            >
              {/* Reply context */}
              {msg.replyTo && (
                <div
                  onClick={(e) => { e.stopPropagation(); jumpToMessage(msg.replyToId) }}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: 6, padding: '4px 8px', marginBottom: 8,
                    background: isMe ? 'rgba(0,0,0,0.18)' : (theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                    cursor: 'pointer', maxWidth: 260, overflow: 'hidden',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 11, color: isMe ? '#fff' : accentColor, marginBottom: 2, opacity: isMe ? 0.85 : 1 }}>
                    {msg.replyTo.senderName}
                  </div>
                  <div style={{ fontSize: 12, color: isMe ? 'rgba(255,255,255,0.75)' : (theme.isDark ? '#aaa' : '#666'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {msg.replyTo.text || (msg.replyTo.mediaUrl ? '📷 媒體檔案' : '')}
                  </div>
                </div>
              )}

              {/* Media */}
              {msg.mediaUrl && (
                isAudio ? (
                  <audio controls src={msg.mediaUrl} style={{ display: 'block', maxWidth: 200 }} />
                ) : isVideo ? (
                  <div onClick={() => onImageClick?.({ url: msg.mediaUrl, type: 'video' })} style={{ cursor: 'zoom-in' }}>
                    <video src={msg.mediaUrl} style={{ display: 'block', maxWidth: 260, maxHeight: 280, borderRadius: 10, objectFit: 'cover', pointerEvents: 'none' }} />
                  </div>
                ) : (
                  <div onClick={() => onImageClick?.({ url: msg.mediaUrl, type: 'image' })} style={{ cursor: 'zoom-in' }}>
                    <img src={msg.mediaUrl} alt="media" style={{ display: 'block', maxWidth: 260, maxHeight: 280, borderRadius: 10, objectFit: 'cover' }} />
                  </div>
                )
              )}

              {/* Text */}
              {msg.text && (
                <span style={{ display: 'block', padding: msg.mediaUrl ? '8px 10px 6px' : 0 }}>
                  {msg.text.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                    part.match(/^https?:\/\/[^\s]+$/)
                      ? <a key={i} href={part} target="_blank" rel="noreferrer"
                          style={{ color: isMe ? '#fff' : (theme.primary || '#06C755'), textDecoration: 'underline', wordBreak: 'break-all' }}
                          onClick={e => e.stopPropagation()}>{part}</a>
                      : part
                  )}
                </span>
              )}

              {/* Reactions */}
              {msg.reactions?.length > 0 && (
                <div style={{
                  position: 'absolute', bottom: -12, [isMe ? 'left' : 'right']: -4,
                  display: 'flex', gap: 2,
                  background: theme.isDark ? '#333' : 'white',
                  borderRadius: 12, padding: '2px 8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  border: `1px solid ${theme.isDark ? '#444' : '#eee'}`, zIndex: 2,
                }}>
                  {groupReactions().map(([emoji, count]) => (
                    <span key={emoji} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {emoji}
                      {count > 1 && <span style={{ fontSize: 10, color: theme.isDark ? '#ccc' : '#666', fontWeight: 700 }}>{count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Desktop three-dots button ──────────────────────────── */}
            {!isMobile && (
              <button
                ref={dotsRef}
                onClick={handleDotsClick}
                style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: (isHovered || showMenu)
                    ? (theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)')
                    : 'transparent',
                  color: theme.isDark ? '#aaa' : '#6b7280',
                  opacity: (isHovered || showMenu) ? 1 : 0,
                  transition: 'all 0.15s',
                  fontSize: 20, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0,
                }}
              >⋮</button>
            )}

            {/* ── Time & read status ─────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', minWidth: 40 }}>
              <div style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{time}</div>
              {isMe && isLastMyMsg && (
                <div style={{ fontSize: 11, color: readCount > 0 ? theme.primary : '#9ca3af', fontWeight: readCount > 0 ? 600 : 400 }}>
                  {readCount > 0 ? (showAvatar ? `已讀 ${readCount}` : '已讀') : '已傳送'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu rendered via portal at document.body — above all stacking contexts */}
      {menuPortal}
    </>
  )
}

function MenuOption({ label, icon, onClick, color, theme, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: isMobile ? '6px 10px' : '8px 10px', borderRadius: 8, background: 'none',
        textAlign: 'left', color: color || (theme.isDark ? '#eee' : '#1a1a1a'),
        fontSize: isMobile ? 13 : 14, fontWeight: 500, cursor: 'pointer', border: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
    >
      <span style={{ fontSize: isMobile ? 14 : 16 }}>{icon}</span>
      {label}
    </button>
  )
}
