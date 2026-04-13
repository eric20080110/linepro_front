import { useState } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import Avatar from '../Common/Avatar'
import Icon from '../Common/Icon'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export default function ChatList() {
  const { currentUser, friends, groups, setActiveChat, activeChat, getLastMessage } = useStore()
  const theme = useTheme()
  const [search, setSearch] = useState('')

  const dmChats = friends.map(friend => {
    const lastMsg = getLastMessage(friend._id, 'dm')
    return { type: 'dm', id: friend._id, user: friend, lastMsg }
  })
  const groupChats = groups.map(group => {
    const lastMsg = getLastMessage(group._id, 'group')
    return { type: 'group', id: group._id, group, lastMsg }
  })
  const allChats = [...dmChats, ...groupChats].sort((a, b) => {
    const aTime = a.lastMsg?.timestamp ? new Date(a.lastMsg.timestamp).getTime() : 0
    const bTime = b.lastMsg?.timestamp ? new Date(b.lastMsg.timestamp).getTime() : 0
    return bTime - aTime
  })
  const filtered = allChats.filter(c => {
    const name = c.type === 'dm' ? (c.user.nickname || c.user.name) : c.group.name
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const handleSelect = (chat) => {
    if (chat.type === 'dm') {
      setActiveChat({ type: 'dm', id: chat.id, user: chat.user })
    } else {
      setActiveChat({ type: 'group', id: chat.id, group: chat.group })
    }
  }

  const isActive = (chat) => activeChat?.type === chat.type && activeChat?.id === chat.id

  const getSenderName = (msg) => {
    if (!msg) return ''
    const senderId = msg.senderId?._id || msg.senderId
    if (senderId === currentUser._id) return '我：'
    const name = msg.senderId?.name || ''
    return name ? `${name.split(' ')[0]}：` : ''
  }

  const bg = theme.isDark ? theme.sidebarBg : 'white'
  const textPrimary = theme.isDark ? '#f0f0f0' : '#1a1a1a'
  const textSecondary = theme.isDark ? '#9ca3af' : '#6b7280'
  const inputBg = theme.isDark ? '#2d2d2d' : '#f3f4f6'
  const inputColor = theme.isDark ? '#f0f0f0' : '#333'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: bg }}>
      <div style={{ padding: '12px 16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 搜尋聊天..."
          style={{
            width: '100%', padding: '10px 14px',
            borderRadius: 24, background: inputBg,
            fontSize: 14, color: inputColor,
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            <div style={{ marginBottom: 8 }}><Icon name="chat" fallback="💬" size={40} style={{ filter: 'grayscale(1) opacity(0.5)' }} /></div>
            <div style={{ color: textSecondary }}>尚無對話</div>
            <div style={{ fontSize: 12, marginTop: 4, color: textSecondary }}>去加好友開始聊天吧！</div>
          </div>
        )}
        {filtered.map(chat => {
          const name = chat.type === 'dm' ? chat.user.name : chat.group.name
          const avatarUser = chat.type === 'dm' ? chat.user : { name: chat.group.name, avatarColor: chat.group.avatarColor }
          const active = isActive(chat)
          return (
            <button
              key={`${chat.type}-${chat.id}`}
              onClick={() => handleSelect(chat)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: active ? theme.activeChat : 'transparent',
                borderLeft: active ? `3px solid ${theme.activeChatBorder}` : '3px solid transparent',
                transition: 'background 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = theme.isDark ? '#2a2a2a' : '#f9fafb' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar user={avatarUser} size={46} showStatus={chat.type === 'dm'} />
                {chat.type === 'group' && (
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    background: theme.primary, borderRadius: '50%',
                    width: 18, height: 18, border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Icon name="groups" fallback="👥" size={10} style={{ filter: 'brightness(0) invert(1)' }} /></div>
                )}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>{name}</span>
                  {chat.lastMsg && (
                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0, marginLeft: 4 }}>
                      {formatDistanceToNow(new Date(chat.lastMsg.timestamp), { addSuffix: false, locale: zhTW })}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {chat.lastMsg
                    ? `${getSenderName(chat.lastMsg)}${chat.lastMsg.text}`
                    : <span style={{ color: '#ccc', fontStyle: 'italic' }}>開始聊天...</span>
                  }
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
