'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Client-only wrapper for OfflineIndicator to prevent hydration mismatch
const OfflineIndicator = dynamic(
  () => import('./OfflineIndicator'),
  {
    ssr: false,
    loading: () => null
  }
)

export default function ClientOnlyOfflineIndicator() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  return <OfflineIndicator />
}