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
    <nav className="w-full py-3 px-6 flex items-center justify-between rounded-2xl bg-slate-900/60 border border-blue-500/20 shadow-xl backdrop-blur-xl relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/20">
          SE
        </div>
        <Link to="/" className="font-extrabold text-lg bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
          SkillExchange
        </Link>
      </div>

      {/* Desktop nav links */}
      <div className="hidden md:flex items-center gap-6">
        <Link to="/best-students" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors">
          Best Students
        </Link>
        {user && (
          <>
            <Link to="/dashboard" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors">
              Dashboard
            </Link>
            <Link to="/search" className="text-sm font-semibold text-slate-300 hover:text-blue-400 transition-colors">
              Courses & Skills
            </Link>
            <NotificationBell />
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user ? (
          /* Logged-in: profile dropdown */
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium hidden sm:block max-w-[120px] truncate text-slate-200">{user.name}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-blue-500/20 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-2xl">
                <div className="px-4 py-2.5 border-b border-white/5">
                  <p className="text-sm font-bold text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                <Link to="/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                  <User size={15} /> View Profile
                </Link>
                <Link to="/settings" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 transition-colors">
                  <Settings size={15} /> Course Selection
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors w-full text-left">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Not logged in */
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-md shadow-blue-600/20">
              Student Sign in
            </Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          aria-label="menu"
          onClick={() => setMenuOpen(v => !v)}
          className="md:hidden p-2 rounded-xl bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-white/5"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div id="mobile-menu" className="md:hidden absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-blue-500/20 shadow-2xl p-4 rounded-2xl z-50">
          <div className="flex flex-col gap-2">
            <Link to="/best-students" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2.5 px-3 rounded-xl text-slate-200 hover:bg-blue-600/10 hover:text-blue-400">Best Students</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2.5 px-3 rounded-xl text-slate-200 hover:bg-blue-600/10 hover:text-blue-400">Dashboard</Link>
                <Link to="/search" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2.5 px-3 rounded-xl text-slate-200 hover:bg-blue-600/10 hover:text-blue-400">Courses & Skills</Link>
                <Link to="/notifications" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2.5 px-3 rounded-xl text-slate-200 hover:bg-blue-600/10 hover:text-blue-400">Notifications</Link>
                <Link to="/settings" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2.5 px-3 rounded-xl text-slate-200 hover:bg-blue-600/10 hover:text-blue-400">Course Selection</Link>
                <button onClick={handleLogout} className="text-sm font-semibold py-2.5 px-3 rounded-xl text-rose-400 hover:bg-rose-500/10 text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 text-center">Sign in</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
