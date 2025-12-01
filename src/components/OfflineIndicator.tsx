'use client'
import { useEffect, useState } from 'react'
import { WifiOff, Wifi, AlertCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isAPIOnline, setIsAPIOnline] = useState(true)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      setShowNotification(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowNotification(true)
    }

    // Check initial network status
    setIsOnline(navigator.onLine)

    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check API status periodically
    const checkAPIStatus = async () => {
      try {
        const response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const apiOnline = response.ok
        setIsAPIOnline(apiOnline)

        if (!apiOnline && !apiClient.isOffline()) {
          setShowNotification(true)
        }
      } catch (error) {
        setIsAPIOnline(false)
        if (!apiClient.isOffline()) {
          setShowNotification(true)
        }
      }
    }

    // Check API status immediately and then every 30 seconds
    checkAPIStatus()
    const apiStatusInterval = setInterval(checkAPIStatus, 30000)

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
      clearInterval(apiStatusInterval)
    }
  }, [])

  useEffect(() => {
    if (isOnline && isAPIOnline) {
      // Hide notification after 3 seconds when back online
      const timer = setTimeout(() => setShowNotification(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, isAPIOnline])

  const isOffline = !isOnline || !isAPIOnline || apiClient.isOffline()

  if (!showNotification && !isOffline) {
    return null
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      showNotification ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className={`px-4 py-3 text-sm font-medium text-center ${
        isOffline
          ? 'bg-red-500 text-white'
          : 'bg-green-500 text-white'
      }`}>
        <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
          {isOffline ? (
            <>
              <WifiOff className="w-4 h-4 flex-shrink-0" />
              {!isOnline ? (
                <span>You're offline. Some features may not work.</span>
              ) : !isAPIOnline ? (
                <span>Server temporarily unavailable. Using offline mode.</span>
              ) : (
                <span>Connection issues detected. Using cached data.</span>
              )}
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 flex-shrink-0" />
              <span>Back online! All features available.</span>
            </>
          )}
        </div>
      </div>

      {isOffline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center gap-2 max-w-md mx-auto text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              You can still search trips and make bookings. Data will sync when connection is restored.
            </span>
          </div>
        </div>
      )}
    </div>
  )
}