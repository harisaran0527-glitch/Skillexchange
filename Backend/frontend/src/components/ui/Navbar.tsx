import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown, Bell, Settings, LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import NotificationBell from '../NotificationBell'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
    setProfileOpen(false)
    setMenuOpen(false)
  }

  return (
    <nav className="w-full py-3 px-6 flex items-center justify-between glass-card relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
          SS
        </div>
        <Link to="/" className="font-bold text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          SkillSwap
        </Link>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/discovery" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
          Discover
        </Link>
        {user && (
          <>
            <Link to="/dashboard" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
              Dashboard
            </Link>
            <Link to="/search" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
              Find Skill
            </Link>
            <Link to="/matches" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors">
              Matches
            </Link>
            <NotificationBell />
          </>
        )}
        <Link to="/admin" className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors">
          Admin
        </Link>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          /* Logged-in: profile dropdown */
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[100px] truncate">{user.name}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <Link to="/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <User size={14} /> View Profile
                </Link>
                <Link to="/settings" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Settings size={14} /> Settings
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left">
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Not logged in */
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          aria-label="menu"
          onClick={() => setMenuOpen(v => !v)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden absolute left-0 right-0 top-full bg-white dark:bg-slate-900 shadow-xl border-t border-slate-100 dark:border-slate-700 p-4 rounded-b-2xl">
          <div className="flex flex-col gap-3">
            <Link to="/discovery" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Discover</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Dashboard</Link>
                <Link to="/matches" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Matches</Link>
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Notifications</Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">Settings</Link>
                <button onClick={handleLogout} className="text-sm font-medium py-2 px-3 rounded-lg text-red-500 hover:bg-red-50 text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm text-center">Sign in</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm text-center">Get Started</Link>
              </>
            )}
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-sm text-slate-400 py-2 px-3 rounded-lg hover:bg-slate-50">Admin</Link>
          </div>
        </div>
      )}
    </nav>
  )
}
