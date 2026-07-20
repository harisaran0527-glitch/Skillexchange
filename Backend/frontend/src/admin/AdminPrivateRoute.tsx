import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from './context/AdminAuthContext'

export default function AdminPrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAdminAuth()
  const location = useLocation()
  if (!token) return <Navigate to="/admin/login" state={{ from: location }} replace />
  return <>{children}</>
}
