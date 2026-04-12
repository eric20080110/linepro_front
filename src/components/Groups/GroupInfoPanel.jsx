import { useState } from 'react'
import useStore from '../../store/useStore'
import Avatar from '../Common/Avatar'

export default function GroupInfoPanel({ group: initialGroup, onClose }) {
  const { currentUser, friends, groups, addGroupMembers, leaveGroup, setActiveChat } = useStore()
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [adding, setAdding] = useState(false)

  // Get fresh group from store
  const group = groups.find(g => g._id === initialGroup._id) || initialGroup
  const members = Array.isArray(group.members) ? group.members : []
  const isAdmin = (group.admins || []).some(a => (a._id || a) === currentUser._id)

  const memberIds = new Set(members.map(m => m._id || m))
  const nonMembers = friends.filter(f => !memberIds.has(f._id))

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleAdd = async () => {
    if (selectedIds.length === 0) return
    setAdding(true)
    try {
      await addGroupMembers(group._id, selectedIds)
      setSelectedIds([])
      setShowAddMember(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleLeave = async () => {
    await leaveGroup(group._id)
    setActiveChat(null)
    onClose()
  }

  const getMemberUser = (m) => {
    if (typeof m === 'object' && m.name) return m
    return null
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 20, width: 400,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        position: 'relative',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '24px', textAlign: 'center',
          background: 'linear-gradient(135deg, #06C755, #00a843)', color: 'white',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 20,
            background: 'rgba(255,255,255,0.2)', color: 'white',
            borderRadius: '50%', width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>×</button>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: group.avatarColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 28,
            border: '3px solid rgba(255,255,255,0.4)',
          }}>
            {group.name[0]}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{group.name}</h3>
          {group.description && <p style={{ fontSize: 13, opacity: 0.85 }}>{group.description}</p>}
          <p style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>{members.length} 位成員</p>
        </div>

        {/* Members */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px 8px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>成員列表</span>
            {!showAddMember && nonMembers.length > 0 && (
              <button
                onClick={() => setShowAddMember(true)}
                style={{ fontSize: 12, fontWeight: 600, color: '#06C755', background: 'none', padding: '4px 8px' }}
              >
                + 邀請成員
              </button>
            )}
          </div>

          {showAddMember && (
            <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>邀請好友加入群組</div>
              {nonMembers.map(f => {
                const sel = selectedIds.includes(f._id)
                return (
                  <button
                    key={f._id}
                    onClick={() => toggleSelect(f._id)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0', background: 'none', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 5,
                      border: sel ? '2px solid #06C755' : '2px solid #d1d5db',
                      background: sel ? '#06C755' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {sel && '✓'}
                    </div>
                    <Avatar user={f} size={32} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{f.name}</span>
                  </button>
                )
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  onClick={handleAdd}
                  disabled={selectedIds.length === 0 || adding}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 8,
                    background: selectedIds.length > 0 ? '#06C755' : '#e5e7eb',
                    color: selectedIds.length > 0 ? 'white' : '#9ca3af',
                    fontSize: 13, fontWeight: 700,
                  }}
                >
                  {adding ? '邀請中...' : '確認邀請'}
                </button>
                <button
                  onClick={() => { setShowAddMember(false); setSelectedIds([]) }}
                  style={{ padding: '9px 16px', borderRadius: 8, background: '#f3f4f6', color: '#374151', fontSize: 13 }}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {members.map((member, i) => {
            const m = getMemberUser(member)
            if (!m) return null
            const adminIds = (group.admins || []).map(a => a._id || a)
            const isAdminMember = adminIds.includes(m._id)
            const isMe = m._id === currentUser._id
            return (
              <div key={m._id || i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
              }}>
                <Avatar user={m} size={40} showStatus />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{m.name}</span>
                    {isAdminMember && (
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', fontWeight: 600 }}>管理員</span>
                    )}
                    {isMe && (
                      <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 10, background: '#eff6ff', color: '#2563eb', fontWeight: 600 }}>我</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>
                    {m.status === 'online' ? '線上' : '離線'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid #f3f4f6' }}>
          <button
            onClick={handleLeave}
            style={{
              width: '100%', padding: '12px', borderRadius: 10,
              background: '#fff0f0', color: '#ef4444', fontSize: 15, fontWeight: 700,
            }}
          >
            離開群組
          </button>
        </div>
      </div>
    </div>
  )
}
