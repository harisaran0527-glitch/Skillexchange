import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, usersApi, AuthUser, AuthResponse } from '../services/api'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    name: string
    email: string
    password: string
    department?: string
    year?: string
    college?: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'skillswap_token'
const USER_KEY = 'skillswap_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(USER_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)

  // Hydrate user from API on mount if we have a token
  useEffect(() => {
    if (token && !user) {
      usersApi.getProfile()
        .then(u => { setUser(u); localStorage.setItem(USER_KEY, JSON.stringify(u)) })
        .catch(() => {
          // token invalid — clear
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
          setToken(null)
          setUser(null)
        })
    }
  }, [])

  function persist(resp: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, resp.token)
    localStorage.setItem(USER_KEY, JSON.stringify(resp.user))
    setToken(resp.token)
    setUser(resp.user)
  }

  async function login(email: string, password: string) {
    setLoading(true)
    try {
      const resp = await authApi.login({ email, password })
      persist(resp)
    } finally {
      setLoading(false)
    }
  }

  async function register(data: Parameters<AuthContextType['register']>[0]) {
    setLoading(true)
    try {
      const resp = await authApi.register(data)
      persist(resp)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    authApi.logout().catch(() => {}) // fire & forget
  }

  async function refreshUser() {
    if (!token) return
    try {
      const u = await usersApi.getProfile()
      setUser(u)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
