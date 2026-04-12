import { useState, useEffect, useRef } from 'react'
import useStore from '../../store/useStore'
import { usersApi } from '../../api/users'
import useIsMobile from '../../hooks/useIsMobile'
import Avatar from '../Common/Avatar'

export default function AddFriendModal({ onClose }) {
  const { currentUser, friends, sendFriendRequest } = useStore()
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(new Set())
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await usersApi.search(search)
        // Filter out already-friends
        const friendIds = new Set(friends.map(f => f._id))
        setResults(data.filter(u => !friendIds.has(u._id) && u._id !== currentUser._id))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  const handleSend = async (userId) => {
    try {
      await sendFriendRequest(userId)
      setSent(prev => new Set([...prev, userId]))
    } catch (err) {
      alert(err.message)
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
        width: isMobile ? '100%' : 380,
        maxHeight: isMobile ? '85%' : '70vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>加好友</h3>
            <button onClick={onClose} style={{ background: 'none', fontSize: 22, color: '#9ca3af' }}>×</button>
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 搜尋使用者名稱或信箱..."
            autoFocus
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 24, background: '#f3f4f6',
              fontSize: 14, color: '#333',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>搜尋中...</div>
          )}
          {!loading && search && results.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>找不到使用者</div>
          )}
          {!loading && !search && (
            <div style={{ padding: 32, textAlign: 'center', color: '#aaa', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
              輸入姓名或信箱搜尋
            </div>
          )}
          {results.map(user => {
            const isSent = sent.has(user._id)
            return (
              <div key={user._id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 24px',
              }}>
                <Avatar user={user} size={44} showStatus />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{user.nickname || user.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{user.email}</div>
                </div>
                <button
                  onClick={() => !isSent && handleSend(user._id)}
                  disabled={isSent}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    background: isSent ? '#f3f4f6' : '#06C755',
                    color: isSent ? '#9ca3af' : 'white',
                    fontSize: 13, fontWeight: 600,
                    cursor: isSent ? 'default' : 'pointer',
                  }}
                >
                  {isSent ? '已申請' : '加好友'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
