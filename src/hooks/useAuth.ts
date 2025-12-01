'use client'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

export interface AuthUser {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: 'ADMIN' | 'CUSTOMER'
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token on mount
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const token = localStorage.getItem('auth_token')
    if (token) {
      // Verify token and get user data using API client with fallbacks
      apiClient.verifyToken(token)
        .then(response => {
          if (response.success && response.data?.user) {
            setUser(response.data.user)
          } else {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_token')
            }
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const signUp = async (email: string, password: string, userData: {
    firstName: string
    lastName: string
    phone: string
  }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          firstName: userData.firstName,
          lastName: userData.lastName
        })
      })

      const data = await response.json()

      if (data.error) {
        return { data: null, error: data.error }
      }

      if (data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token)
        }
        setUser(data.user)
      }

      return { data: data.user, error: null }
    } catch (error) {
      return { data: null, error: 'Registration failed' }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password)

      if (!response.success) {
        return { data: null, error: response.error || 'Login failed' }
      }

      if (response.data?.token && response.data?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', response.data.token)
        }
        setUser(response.data.user)
        return { data: response.data.user, error: null }
      }

      return { data: null, error: 'Invalid login response' }
    } catch (error) {
      return { data: null, error: 'Login failed - please try again' }
    }
  }

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    setUser(null)
  }

  const updateProfile = async (updates: {
    firstName?: string
    lastName?: string
    phone?: string
  }) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (data.error) {
        return { error: data.error }
      }

      setUser(data.user)
      return { error: null }
    } catch (error) {
      return { error: 'Profile update failed' }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (data.error) {
        return { error: data.error }
      }

      return { error: null }
    } catch (error) {
      return { error: 'Password reset failed' }
    }
  }

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'ADMIN'
  const isDriver = false // No driver role in current system

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    isAuthenticated,
    isAdmin,
    isDriver
  }
}