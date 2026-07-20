import React, { useState, useEffect, useRef } from 'react'
import { Bell, Search, Moon, ChevronDown, User, Settings, LogOut, Check, Trash } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'
import { useNavigate } from 'react-router-dom'
import { adminNotificationsApi } from '../services/adminApi'

interface TopBarProps { title: string }

export default function TopBar({ title }: TopBarProps) {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [dropOpen, setDropOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (admin) {
      loadNotifications()
    }
  }, [admin])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifications() {
    try {
      const list = await adminNotificationsApi.getAll()
      setNotifications(list || [])
    } catch (err) {}
  }

  async function markAsRead(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await adminNotificationsApi.markRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
    } catch (err) {}
  }

  async function deleteNotif(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await adminNotificationsApi.delete(id)
      setNotifications(prev => prev.filter(n => n._id !== id))
    } catch (err) {}
  }

  const unreadCount = notifications.filter(n => !n.read).length

  function handleLogout() { logout(); navigate('/admin/login') }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 z-20"
      style={{ background: 'rgba(11,13,26,0.95)', backdropFilter: 'blur(12px)' }}>

      {/* Left: title */}
      <div>
        <h1 className="text-lg font-bold text-white">{title}</h1>
        <p className="text-xs text-slate-500">SkillSwap Admin Portal</p>
      </div>

      {/* Right: search + notifications + profile */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400">
          <Search size={14} />
          <input
            type="text" placeholder="Quick search…"
            className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-36 focus:w-48 transition-all"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Bell size={16} className="text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[350px] overflow-y-auto rounded-2xl border border-white/10 py-3 shadow-2xl z-50 bg-[#16192b]">
              <div className="px-4 pb-2 border-b border-white/5 flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">System Events</span>
                {unreadCount > 0 && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>}
              </div>
              <div className="divide-y divide-white/5 max-h-[250px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No recent events logged.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className={`p-3 text-xs flex justify-between gap-3 hover:bg-white/[0.02] transition-colors ${!n.read ? 'bg-indigo-500/5' : ''}`}>
                      <div className="flex-1">
                        <p className={`text-slate-300 ${!n.read ? 'font-semibold text-white' : ''}`}>{n.message}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{n.createdDate} {n.createdTime}</p>
                      </div>
                      <div className="flex gap-1.5 self-start">
                        {!n.read && (
                          <button onClick={(e) => markAsRead(n._id, e)} className="p-1 rounded bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors">
                            <Check size={11} />
                          </button>
                        )}
                        <button onClick={(e) => deleteNotif(n._id, e)} className="p-1 rounded bg-white/5 text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
              {admin?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-200 hidden sm:block">{admin?.name}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 py-2 shadow-2xl z-50"
              style={{ background: '#1a1d2e' }}>
              <div className="px-4 py-2 border-b border-white/5 mb-1">
                <p className="text-xs font-semibold text-white">{admin?.name}</p>
                <p className="text-[10px] text-slate-400">{admin?.email}</p>
              </div>
              <button onClick={() => { navigate('/admin/settings'); setDropOpen(false) }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                <Settings size={13} /> Settings
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors">
                <LogOut size={13} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
