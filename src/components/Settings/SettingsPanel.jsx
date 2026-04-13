import { useState } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import useIsMobile from '../../hooks/useIsMobile'
import { THEMES } from '../../theme/themes'
import { messagesApi } from '../../api/messages'
import Icon from '../Common/Icon'

const THEME_SWATCHES = {
  purple: ['#8661C1', '#BE97C6', '#EFBCD5', '#FFFFFF'],
  bw:     ['#111111', '#555555', '#dddddd', '#FFFFFF'],
  dark:   ['#1a1a1a', '#4a4a4a', '#6b6b6b', '#888888'],
  warm:   ['#FFA737', '#DC851F', '#7E5920', '#FFFBF5'],
  blue:   ['#2B3A67', '#6D9DC5', '#E2FCEF', '#F0F8FF'],
}

export default function SettingsPanel({ onClose }) {
  const { theme: currentTheme, setTheme, friends, groups, currentUser, getDMRoomId, deleteChatMessages, activeChat, setActiveChat } = useStore()
  const theme = useTheme()
  const isMobile = useIsMobile()
  const [confirmDelete, setConfirmDelete] = useState(null) // { type, id, name, chatKey }
  const [deleting, setDeleting] = useState(false)
  const [activeSection, setActiveSection] = useState('theme')

  const dmChats = friends.map(f => ({
    type: 'dm',
    id: f._id,
    name: f.nickname || f.name,
    avatarColor: f.avatarColor,
    chatKey: getDMRoomId(currentUser._id, f._id),
  }))
  const groupChats = groups.map(g => ({
    type: 'group',
    id: g._id,
    name: g.name,
    avatarColor: g.avatarColor,
    chatKey: `group:${g._id}`,
  }))
  const allChats = [...dmChats, ...groupChats]

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      if (confirmDelete.type === 'dm') {
        await messagesApi.deleteDM(confirmDelete.id)
      } else {
        await messagesApi.deleteGroup(confirmDelete.id)
      }
      deleteChatMessages(confirmDelete.chatKey)
      // If currently viewing deleted chat, clear messages display
      if (activeChat?.id === confirmDelete.id) {
        setActiveChat({ ...activeChat })
      }
      setConfirmDelete(null)
    } catch (err) {
      alert('刪除失敗：' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const sectionBtnStyle = (id) => ({
    width: '100%',
    textAlign: 'left',
    padding: '10px 16px',
    borderRadius: 8,
    background: activeSection === id ? theme.activeChat : 'transparent',
    color: activeSection === id ? theme.primary : (theme.isDark ? '#9ca3af' : '#374151'),
    fontWeight: activeSection === id ? 700 : 500,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s',
    marginBottom: 2,
  })

  return (
    <div style={{
      position: isMobile ? 'absolute' : 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: theme.isDark ? theme.cardBg : 'white',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: isMobile ? '100%' : 640,
        height: isMobile ? '92%' : 480,
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>

        {/* Left nav */}
        <div style={{
          width: isMobile ? 140 : 180,
          background: theme.isDark ? '#1e1e1e' : '#f9fafb',
          borderRight: `1px solid ${theme.isDark ? '#333' : '#e5e7eb'}`,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: theme.isDark ? '#f0f0f0' : '#1a1a1a', marginBottom: 16, paddingLeft: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="settings" fallback="⚙️" size={18} style={{ filter: theme.isDark ? 'brightness(0) invert(1)' : 'brightness(0)' }} /> 設定
          </div>
          <button style={{ ...sectionBtnStyle('theme'), display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setActiveSection('theme')}>
            <Icon name="theme" fallback="🎨" size={16} style={{ filter: (activeSection === 'theme' ? (theme.id === 'bw' || theme.id === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)') : (theme.isDark ? 'brightness(0) invert(1) opacity(0.5)' : 'brightness(0) opacity(0.6)') ) }} /> 主題顏色
          </button>
          <button style={{ ...sectionBtnStyle('chat'), display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setActiveSection('chat')}>
            <Icon name="delete" fallback="🗑️" size={16} style={{ filter: (activeSection === 'chat' ? (theme.id === 'bw' || theme.id === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)') : (theme.isDark ? 'brightness(0) invert(1) opacity(0.5)' : 'brightness(0) opacity(0.6)') ) }} /> 刪除聊天室
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            padding: '8px 12px', borderRadius: 8,
            background: theme.isDark ? '#2d2d2d' : '#f3f4f6',
            color: theme.isDark ? '#9ca3af' : '#6b7280',
            fontSize: 13, fontWeight: 600,
          }}>關閉</button>
        </div>

        {/* Right content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>

          {/* Theme section */}
          {activeSection === 'theme' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: theme.isDark ? '#f0f0f0' : '#1a1a1a', marginBottom: 6 }}>主題顏色</h3>
              <p style={{ fontSize: 13, color: theme.isDark ? '#9ca3af' : '#6b7280', marginBottom: 20 }}>選擇你喜歡的介面風格</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.values(THEMES).map(t => {
                  const swatches = THEME_SWATCHES[t.id]
                  const isActive = currentTheme.id === t.id
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 16px',
                        borderRadius: 12,
                        border: isActive ? `2px solid ${t.primary}` : `2px solid ${theme.isDark ? '#333' : '#e5e7eb'}`,
                        background: isActive ? (theme.isDark ? '#2a2a2a' : t.accent + '33') : (theme.isDark ? '#252525' : 'white'),
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {/* Color preview */}
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {swatches.map((color, i) => (
                          <div key={i} style={{
                            width: 20, height: 36,
                            borderRadius: 6,
                            background: color,
                            border: '1px solid rgba(0,0,0,0.08)',
                            flexShrink: 0,
                          }} />
                        ))}
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: theme.isDark ? '#f0f0f0' : '#1a1a1a' }}>
                          {t.name}
                        </div>
                        <div style={{ fontSize: 12, color: theme.isDark ? '#9ca3af' : '#9ca3af', marginTop: 2 }}>
                          {swatches.slice(0, 3).join(' · ')}
                        </div>
                      </div>
                      {isActive && (
                        <div style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: t.primary,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>✓</div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Delete chat section */}
          {activeSection === 'chat' && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: theme.isDark ? '#f0f0f0' : '#1a1a1a', marginBottom: 6 }}>刪除聊天室紀錄</h3>
              <p style={{ fontSize: 13, color: theme.isDark ? '#9ca3af' : '#6b7280', marginBottom: 20 }}>
                刪除後訊息將無法復原
              </p>
              {allChats.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af', fontSize: 14 }}>
                  尚無聊天記錄
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allChats.map(chat => (
                  <div key={`${chat.type}-${chat.id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 10,
                    background: theme.isDark ? '#252525' : '#f9fafb',
                    border: `1px solid ${theme.isDark ? '#333' : '#e5e7eb'}`,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: chat.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0,
                    }}>
                      {chat.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: theme.isDark ? '#f0f0f0' : '#1a1a1a' }}>{chat.name}</div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{chat.type === 'dm' ? '私人訊息' : '群組聊天'}</div>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(chat)}
                      style={{
                        padding: '6px 12px', borderRadius: 8,
                        background: '#fff0f0', color: '#ef4444',
                        fontSize: 12, fontWeight: 600,
                      }}
                    >
                      刪除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div style={{
          position: isMobile ? 'absolute' : 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000,
        }} onClick={() => !deleting && setConfirmDelete(null)}>
          <div style={{
            background: theme.isDark ? '#252525' : 'white',
            borderRadius: 16, padding: 28, width: 340,
            boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <Icon name="delete" fallback="🗑️" size={48} style={{ filter: theme.isDark ? 'brightness(0) invert(1) opacity(0.8)' : 'brightness(0) opacity(0.6)' }} />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: theme.isDark ? '#f0f0f0' : '#1a1a1a', textAlign: 'center', marginBottom: 8 }}>
              確認刪除
            </h4>
            <p style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginBottom: 20 }}>
              確定要刪除與「{confirmDelete.name}」的所有聊天記錄嗎？此操作無法復原。
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: '#ef4444', color: 'white',
                  fontSize: 14, fontWeight: 700,
                }}
              >
                {deleting ? '刪除中...' : '確認刪除'}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8,
                  background: theme.isDark ? '#333' : '#f3f4f6',
                  color: theme.isDark ? '#ccc' : '#374151',
                  fontSize: 14, fontWeight: 600,
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
