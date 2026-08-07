'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2'
import { playgroundLogin, PlaygroundUser } from '@/services/playgroundAuthService'

const TOKEN_KEY = 'playground_token'
const USER_KEY = 'playground_user'

interface PlaygroundAuthContextType {
  user: PlaygroundUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  loading: boolean
  isTokenLoaded: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const PlaygroundAuthContext = createContext<PlaygroundAuthContextType | undefined>(undefined)

export function PlaygroundAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PlaygroundUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTokenLoaded, setIsTokenLoaded] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }

    setIsTokenLoaded(true)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)

    try {
      const { access_token, user: loggedInUser } = await playgroundLogin(email, password)

      localStorage.setItem(TOKEN_KEY, access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))
      setToken(access_token)
      setUser(loggedInUser)

      Swal.fire({
        title: 'Success!',
        text: 'Login successful!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
      Swal.fire({
        title: 'Login Failed',
        text: message,
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <PlaygroundAuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        loading,
        isTokenLoaded,
        login,
        logout,
      }}
    >
      {children}
    </PlaygroundAuthContext.Provider>
  )
}

export function usePlaygroundAuth() {
  const context = useContext(PlaygroundAuthContext)
  if (context === undefined) {
    throw new Error('usePlaygroundAuth must be used within a PlaygroundAuthProvider')
  }
  return context
}
