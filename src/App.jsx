import { useEffect } from 'react'
import { useUser, useAuth, SignIn } from '@clerk/clerk-react'
import useStore from './store/useStore'
import { setTokenGetter } from './api/client'
import { useSocket } from './hooks/useSocket'
import { ThemeContext } from './theme/ThemeContext'
import Sidebar from './components/Sidebar/Sidebar'
import ChatWindow from './components/Chat/ChatWindow'
import CallModal from './components/Chat/CallModal'

export default function App() {
  const { isSignedIn, isLoaded } = useUser()
  const { getToken } = useAuth()
  const { currentUser, syncing, syncUser, theme, activeCall, incomingCall, setActiveCall, setIncomingCall } = useStore()

  useEffect(() => {
    setTokenGetter(() => getToken())
  }, [getToken])

  useEffect(() => {
    if (isSignedIn && !currentUser && !syncing) {
      syncUser()
    }
  }, [isSignedIn, currentUser, syncing])

  useSocket(currentUser?._id)

  if (!isLoaded) {
    return (
      <div style={{
        width: '100%', height: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.loginGradient,
      }}>
        <div style={{ fontSize: 40 }}>⏳</div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div style={{
        width: '100%', height: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.loginGradient,
      }}>
        <SignIn />
      </div>
    )
  }

  if (!currentUser || syncing) {
    return (
      <div style={{
        width: '100%', height: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme.loginGradient, flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 40 }}>💬</div>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: 600 }}>正在同步帳號資料...</p>
      </div>
    )
  }

  const callTarget = activeCall || incomingCall
  const callPartnerUser = activeCall
    ? activeCall.partnerUser
    : (incomingCall ? { _id: incomingCall.callerId, name: incomingCall.callerName } : null)

  const handleCloseCall = () => {
    setActiveCall(null)
    setIncomingCall(null)
  }

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{
        display: 'flex', width: '100%', height: '100%',
        background: theme.background,
      }}>
        <Sidebar />
        <ChatWindow />
        {callTarget && callPartnerUser && (
          <CallModal
            mode={activeCall ? 'calling' : 'incoming'}
            partnerId={activeCall?.partnerId ?? incomingCall?.callerId}
            partnerUser={callPartnerUser}
            offer={incomingCall?.offer}
            onClose={handleCloseCall}
          />
        )}
      </div>
    </ThemeContext.Provider>
  )
}
