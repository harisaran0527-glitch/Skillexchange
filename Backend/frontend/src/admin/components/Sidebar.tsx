import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, MessageSquare,
  BarChart3, Settings, LogOut, ChevronLeft, ChevronRight,
  Shield, Zap
} from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/students',  icon: Users,           label: 'Students' },
  { path: '/admin/skills',    icon: BookOpen,         label: 'Skills' },
  { path: '/admin/courses',   icon: BookOpen,         label: 'Courses' },
  { path: '/admin/requests',  icon: MessageSquare,    label: 'Requests' },
  { path: '/admin/reports',   icon: BarChart3,        label: 'Reports' },
  { path: '/admin/settings',  icon: Settings,         label: 'Settings' },
]

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
  const { admin, logout } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="admin-sidebar flex-shrink-0 flex flex-col h-screen sticky top-0 z-30 overflow-hidden"
      style={{ background: '#111320', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
          <Shield size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <p className="font-bold text-white text-sm leading-none">SkillSwap</p>
              <p className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase mt-0.5">Admin Portal</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-full" />
              )}
              <item.icon size={18} className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Admin info + logout */}
      <div className="px-2 pb-4 space-y-2 border-t border-white/5 pt-3">
        {!collapsed && admin && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-white truncate">{admin.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{admin.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all w-full"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-500 transition-colors z-40"
      >
        {collapsed ? <ChevronRight size={12} className="text-white" /> : <ChevronLeft size={12} className="text-white" />}
      </button>
    </motion.aside>
  )
}
