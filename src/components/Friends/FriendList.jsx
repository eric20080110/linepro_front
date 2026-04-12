import { useState } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import Avatar from '../Common/Avatar'
import AddFriendModal from './AddFriendModal'

export default function FriendList() {
  const {
    friends, friendRequests, friendsLoading,
    removeFriend, acceptFriendRequest, rejectFriendRequest,
    setActiveChat, setActiveTab,
  } = useStore()
  const theme = useTheme()
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = friends.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
  const textPrimary = theme.isDark ? '#f0f0f0' : '#1a1a1a'
  const textSecondary = theme.isDark ? '#9ca3af' : '#6b7280'
  const inputBg = theme.isDark ? '#2d2d2d' : '#f3f4f6'
  const sectionBg = theme.isDark ? '#222' : '#f9fafb'
  const rowBorder = theme.isDark ? '#2a2a2a' : '#f9f9f9'
  const bg = theme.isDark ? theme.sidebarBg : 'white'

  const startChat = (friend) => {
    setActiveChat({ type: 'dm', id: friend._id, user: friend })
    setActiveTab('chats')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: bg }}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜尋好友..."
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: 24, background: inputBg,
              fontSize: 14, color: textPrimary,
            }}
          />
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: '8px 14px', borderRadius: 24,
              background: theme.buttonPrimary, color: 'white',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
          >
            + 加好友
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {friendRequests.length > 0 && (
          <div>
            <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#9ca3af', background: sectionBg }}>
              好友申請 ({friendRequests.length})
            </div>
            {friendRequests.map(user => (
              <div key={user._id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderBottom: `1px solid ${rowBorder}`,
              }}>
                <Avatar user={user} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>想加你為好友</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => acceptFriendRequest(user._id)} style={{ padding: '6px 12px', borderRadius: 8, background: theme.buttonPrimary, color: 'white', fontSize: 12, fontWeight: 600 }}>接受</button>
                  <button onClick={() => rejectFriendRequest(user._id)} style={{ padding: '6px 12px', borderRadius: 8, background: theme.isDark ? '#333' : '#f3f4f6', color: textSecondary, fontSize: 12, fontWeight: 600 }}>拒絕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#9ca3af', background: sectionBg }}>
          好友 ({filtered.length})
        </div>
        {friendsLoading && <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>載入中...</div>}
        {!friendsLoading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
            <div style={{ color: textSecondary }}>尚無好友</div>
            <div style={{ fontSize: 12, marginTop: 4, color: textSecondary }}>點擊「加好友」開始連結！</div>
          </div>
        )}
        {filtered.map(friend => (
          <div key={friend._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${rowBorder}` }}>
            <Avatar user={friend} size={44} showStatus />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>{friend.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                {friend.statusMessage || (friend.status === 'online' ? '線上' : friend.status === 'away' ? '離開中' : '離線')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => startChat(friend)} style={{ padding: '7px 12px', borderRadius: 8, background: theme.buttonPrimary, color: 'white', fontSize: 12, fontWeight: 600 }}>傳訊息</button>
              <button onClick={() => removeFriend(friend._id)} style={{ padding: '7px 8px', borderRadius: 8, background: '#fff0f0', color: '#ef4444', fontSize: 12 }}>移除</button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && <AddFriendModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
