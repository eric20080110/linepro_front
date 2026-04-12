import { useState } from 'react'
import { useClerk } from '@clerk/clerk-react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'
import ChatList from './ChatList'
import FriendList from '../Friends/FriendList'
import GroupList from '../Groups/GroupList'
import ProfilePanel from './ProfilePanel'
import SettingsPanel from '../Settings/SettingsPanel'

const tabs = [
  { id: 'chats', label: '聊天', icon: '💬' },
  { id: 'friends', label: '好友', icon: '👥' },
  { id: 'groups', label: '群組', icon: '🏠' },
]

export default function Sidebar() {
  const { currentUser, activeTab, setActiveTab, logout, activeChat } = useStore()
  const { signOut } = useClerk()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleLogout = async () => {
    logout()
    await signOut()
  }

  const containerStyle = isMobile
    ? {
        position: 'absolute', inset: 0, zIndex: 10,
        background: theme.isDark ? theme.sidebarBg : 'white',
        display: 'flex', flexDirection: 'column',
        transform: activeChat ? 'translateX(-100%)' : 'translateX(0)',
        transition: 'transform 0.3s ease',
      }
    : {
        width: 340, minWidth: 340,
        height: '100dvh',
        background: theme.isDark ? theme.sidebarBg : 'white',
        borderRight: `1px solid ${theme.isDark ? '#333' : '#e5e7eb'}`,
        display: 'flex', flexDirection: 'column',
      }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0', background: theme.sidebarHeaderGradient }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setShowProfile(true)} style={{ background: 'none', padding: 0 }}>
              <Avatar user={currentUser} size={40} showStatus />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>{currentUser?.nickname || currentUser?.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                {currentUser?.statusMessage || '點擊頭像編輯個人資料'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setShowSettings(true)}
              title="設定"
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 10px', borderRadius: 20,
                color: 'white', fontSize: 14,
                minHeight: 44, minWidth: 44,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ⚙️
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '6px 12px', borderRadius: 20,
                color: 'white', fontSize: 12, fontWeight: 600,
                minHeight: 44,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              登出
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: '10px 0', background: 'none',
                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.65)',
                fontSize: 13, fontWeight: 600,
                borderBottom: activeTab === tab.id ? '3px solid white' : '3px solid transparent',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'chats' && <ChatList />}
        {activeTab === 'friends' && <FriendList />}
        {activeTab === 'groups' && <GroupList />}
      </div>

      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}
