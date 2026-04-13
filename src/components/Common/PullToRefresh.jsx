import { useState, useEffect } from 'react'
import Icon from './Icon'

export default function PullToRefresh({ children, isMobile }) {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)

  useEffect(() => {
    if (!isMobile) return

    let startY = 0
    let isPullingState = false
    let isValidPull = false

    const onTouchStart = (e) => {
      // Check if we are inside a scrollable container
      const scrollable = e.target.closest('[style*="overflowY"], [style*="overflow-y"]')
      // If we are scrolled down even a bit, disable pull-to-refresh
      if (scrollable && scrollable.scrollTop > 0) return

      startY = e.touches[0].clientY
      isPullingState = true
      isValidPull = true
    }

    const onTouchMove = (e) => {
      if (!isPullingState) return
      const y = e.touches[0].clientY
      const dy = y - startY
      
      if (dy > 0 && isValidPull) {
        // Pulling down
        if (dy > 10) {
          setIsPulling(true)
          if (e.cancelable) e.preventDefault() // prevent native overscroll
          setPullY(Math.min(dy * 0.4, 80)) // Max pull distance
        }
      } else if (dy < 0) {
        // Swiping up (scrolling down normally)
        isValidPull = false
        setPullY(0)
        setIsPulling(false)
      }
    }

    const onTouchEnd = () => {
      if (!isPullingState) return
      isPullingState = false
      setIsPulling(false)
      
      setPullY(prev => {
        if (prev > 60 && !refreshing) {
          setRefreshing(true)
          window.location.reload()
        }
        return 0
      })
    }

    // Attach passive: false to allow preventDefault()
    document.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [isMobile, refreshing])

  if (!isMobile) return <>{children}</>

  return (
    <>
      {/* Pull indicator positioned absolute at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: `translateY(${pullY - 60}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s',
        zIndex: 9999, color: '#aaa', fontSize: 20
      }}>
        <div className={refreshing ? 'animate-spin' : ''} style={{
          transform: `rotate(${pullY * 2}deg)`,
          transition: isPulling ? 'none' : 'all 0.3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {refreshing ? <Icon name="loading" fallback="⏳" size={24} style={{ filter: 'grayscale(1)' }} /> : <Icon name="arrow_down" fallback="⬇️" size={24} style={{ filter: 'grayscale(1)' }} />}
        </div>
      </div>
      
      {/* Wraps all app content, applying transform when pulled */}
      <div style={{
        flex: 1, width: '100%', height: '100%',
        transform: `translateY(${pullY}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s',
      }}>
        {children}
      </div>
    </>
  )
}