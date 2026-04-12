import { useState } from 'react'
import useStore from '../../store/useStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, loginError, users } = useStore()

  const handleSubmit = (e) => {
    e.preventDefault()
    login(email, password)
  }

  const quickLogin = (user) => {
    setEmail(user.email)
    setPassword(user.password)
    login(user.email, user.password)
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #06C755 0%, #00a843 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 20,
        padding: '48px 40px',
        width: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: 20,
            background: '#06C755',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 36,
          }}>
            💬
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>LinePro</h1>
          <p style={{ color: '#888', marginTop: 6, fontSize: 14 }}>登入您的帳號</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              電子郵件
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="輸入您的電子郵件"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1.5px solid #e5e7eb',
                fontSize: 15,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#06C755'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="輸入您的密碼"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1.5px solid #e5e7eb',
                fontSize: 15,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#06C755'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {loginError && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8, textAlign: 'center' }}>
              {loginError}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 10,
              background: '#06C755',
              color: 'white',
              fontSize: 16,
              fontWeight: 700,
              marginTop: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.target.style.background = '#05b34d'}
            onMouseLeave={e => e.target.style.background = '#06C755'}
          >
            登入
          </button>
        </form>

        {/* Quick login */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>快速切換帳號</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => quickLogin(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#f9fafb',
                  border: '1.5px solid #e5e7eb',
                  fontSize: 13,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#06C755' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb' }}
              >
                <div style={{
                  width: 30, height: 30,
                  borderRadius: '50%',
                  background: user.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {(user.nickname || user.name)[0]}
                </div>
                <span style={{ fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.nickname || user.name}
                </span>
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 12 }}>
            所有帳號密碼均為 123456
          </p>
        </div>
      </div>
    </div>
  )
}
