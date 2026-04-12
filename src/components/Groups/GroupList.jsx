import { useState } from 'react'
import useStore from '../../store/useStore'
import { useTheme } from '../../theme/ThemeContext'
import Avatar from '../Common/Avatar'
import CreateGroupModal from './CreateGroupModal'

export default function GroupList() {
  const { groups, groupsLoading, setActiveChat, setActiveTab, leaveGroup } = useStore()
  const theme = useTheme()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
  const textPrimary = theme.isDark ? '#f0f0f0' : '#1a1a1a'
  const textSecondary = theme.isDark ? '#9ca3af' : '#6b7280'
  const inputBg = theme.isDark ? '#2d2d2d' : '#f3f4f6'
  const sectionBg = theme.isDark ? '#222' : '#f9fafb'
  const rowBorder = theme.isDark ? '#2a2a2a' : '#f9f9f9'
  const bg = theme.isDark ? theme.sidebarBg : 'white'

  const openGroup = (group) => {
    setActiveChat({ type: 'group', id: group._id, group })
    setActiveTab('chats')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: bg }}>
      <div style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜尋群組..."
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: 24, background: inputBg,
              fontSize: 14, color: textPrimary,
            }}
          />
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '8px 14px', borderRadius: 24,
              background: theme.buttonPrimary, color: 'white',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}
          >
            + 建群組
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#9ca3af', background: sectionBg }}>
          我的群組 ({filtered.length})
        </div>
        {groupsLoading && <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>載入中...</div>}
        {!groupsLoading && filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
            <div style={{ color: textSecondary }}>尚無群組</div>
            <div style={{ fontSize: 12, marginTop: 4, color: textSecondary }}>建立群組一起聊天吧！</div>
          </div>
        )}
        {filtered.map(group => (
          <div key={group._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${rowBorder}` }}>
            <div style={{ position: 'relative' }}>
              <Avatar user={{ name: group.name, avatarColor: group.avatarColor }} size={46} />
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                background: theme.primary, borderRadius: '50%',
                width: 18, height: 18, fontSize: 10, border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>👥</div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: textPrimary }}>{group.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>
                {group.members.length} 位成員{group.description && ` · ${group.description}`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => openGroup(group)} style={{ padding: '7px 12px', borderRadius: 8, background: theme.buttonPrimary, color: 'white', fontSize: 12, fontWeight: 600 }}>進入</button>
              <button onClick={() => leaveGroup(group._id)} style={{ padding: '7px 8px', borderRadius: 8, background: '#fff0f0', color: '#ef4444', fontSize: 12 }}>離開</button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
