import { useState, useRef, useEffect } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'
import MessageBubble from './MessageBubble'
import GroupInfoPanel from '../Groups/GroupInfoPanel'

export default function ChatWindow() {
  const { currentUser, activeChat, setActiveChat, getMessages, sendMessage, messagesLoading } = useStore()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [vpTop, setVpTop] = useState(0)
  const [vpHeight, setVpHeight] = useState(() => window.innerHeight)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Track visual viewport to keep container above keyboard (iOS Safari)
  useEffect(() => {
    if (!isMobile) return
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      setVpTop(vv.offsetTop)
      setVpHeight(vv.height)
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [isMobile])

  const messages = getMessages()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
          position: 'fixed', top: vpTop, left: 0, right: 0,
          height: vpHeight, zIndex: 10,
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
        <div style={{ fontSize: 80 }}>💬</div>
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
        position: 'fixed', top: vpTop, left: 0, right: 0, zIndex: 10,
        height: vpHeight,
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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
        {messagesLoading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textSecondary, fontSize: 14 }}>
            載入訊息中...
          </div>
        )}
        {!messagesLoading && groupedMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: textSecondary, fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
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
            />
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 20px',
        background: headerBg,
        borderTop: `1px solid ${borderColor}`,
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
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
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: (input.trim() && !sending) ? theme.buttonPrimary : (theme.isDark ? '#333' : '#e5e7eb'),
            color: 'white', fontSize: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 0.2s',
          }}
        >
          {sending ? '⏳' : '➤'}
        </button>
      </div>

      {showInfo && activeChat.type === 'group' && (
        <GroupInfoPanel group={activeChat.group} onClose={() => setShowInfo(false)} />
      )}
    </div>
  )
}
