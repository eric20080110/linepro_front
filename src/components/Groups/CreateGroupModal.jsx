import { useState } from 'react'
import useStore from '../../store/useStore'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'

export default function CreateGroupModal({ onClose }) {
  const { friends, createGroup, setActiveChat, setActiveTab } = useStore()
  const isMobile = useIsMobile()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [creating, setCreating] = useState(false)

  const toggleMember = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleCreate = async () => {
    if (!name.trim() || selectedIds.length === 0) return
    setCreating(true)
    try {
      const newGroup = await createGroup(name.trim(), description.trim(), selectedIds)
      setActiveChat({ type: 'group', id: newGroup._id, group: newGroup })
      setActiveTab('chats')
      onClose()
    } catch (err) {
      alert(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{
      position: isMobile ? 'absolute' : 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '20px 20px 0 0' : 20,
        width: isMobile ? '100%' : 400,
        maxHeight: isMobile ? '92%' : '80vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>建立群組</h3>
            <button onClick={onClose} style={{ background: 'none', fontSize: 22, color: '#9ca3af' }}>×</button>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              群組名稱 *
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="輸入群組名稱"
              maxLength={30}
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e5e7eb', fontSize: 14,
              }}
              onFocus={e => e.target.style.borderColor = '#06C755'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              群組說明（選填）
            </label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="輸入群組說明"
              maxLength={60}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid #e5e7eb', fontSize: 14,
              }}
              onFocus={e => e.target.style.borderColor = '#06C755'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          <div style={{ padding: '0 24px 8px', fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>
            選擇成員（{selectedIds.length} 已選）
          </div>
          {friends.length === 0 && (
            <div style={{ padding: '20px 24px', fontSize: 14, color: '#9ca3af' }}>
              請先加好友才能建立群組
            </div>
          )}
          {friends.map(friend => {
            const selected = selectedIds.includes(friend._id)
            return (
              <button
                key={friend._id}
                onClick={() => toggleMember(friend._id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 24px',
                  background: selected ? '#f0fdf4' : 'transparent',
                  transition: 'background 0.15s', textAlign: 'left',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: selected ? '2px solid #06C755' : '2px solid #d1d5db',
                  background: selected ? '#06C755' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: 13, color: 'white', fontWeight: 700,
                  transition: 'all 0.15s',
                }}>
                  {selected && '✓'}
                </div>
                <Avatar user={friend} size={38} showStatus />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{friend.nickname || friend.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{friend.email}</div>
                  </div>
              </button>
            )
          })}
        </div>

        <div style={{ padding: 20, borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedIds.length === 0 || creating}
            style={{
              width: '100%', padding: '13px', borderRadius: 10,
              background: (!name.trim() || selectedIds.length === 0 || creating) ? '#e5e7eb' : '#06C755',
              color: (!name.trim() || selectedIds.length === 0 || creating) ? '#9ca3af' : 'white',
              fontSize: 15, fontWeight: 700,
              cursor: (!name.trim() || selectedIds.length === 0 || creating) ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? '建立中...' : `建立群組 ${selectedIds.length > 0 ? `（${selectedIds.length + 1} 人）` : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}
