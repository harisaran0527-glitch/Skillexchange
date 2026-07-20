import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { adminAuthApi, AdminUser, getAdminToken, getAdminUser, setAdminSession, clearAdminSession } from '../services/adminApi'

interface AdminAuthContextType {
  admin: AdminUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => getAdminUser())
  const [token, setToken] = useState<string | null>(() => getAdminToken())
  const [loading, setLoading] = useState(false)

  async function login(email: string, password: string) {
    setLoading(true)
    try {
      const resp = await adminAuthApi.login(email, password)
      setAdminSession(resp.token, resp.admin)
      setToken(resp.token)
      setAdmin(resp.admin)
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    clearAdminSession()
    setToken(null)
    setAdmin(null)
  }

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider')
  return ctx
}
