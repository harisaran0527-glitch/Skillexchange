import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Eye, EyeOff, AlertCircle, GraduationCap } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext'

export default function AdminLogin() {
  const { login, token, loading } = useAdminAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required.'); return }
    try {
      await login(email, password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0b0d1a' }}>

      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="rounded-3xl p-8 shadow-2xl"
          style={{ background: 'rgba(17,19,32,0.95)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>

          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/30"
              style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
            >
              <Shield size={28} className="text-white" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-white">Admin Portal</h1>
            <p className="text-slate-400 text-sm mt-1">SkillExchange Administration</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
              🔒 Restricted Access
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm text-rose-300"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)' }}
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="admin-input w-full"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="admin-input w-full pr-11"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              className="w-full py-3 rounded-xl font-bold text-sm text-white mt-2 transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}
            >
              {loading ? 'Authenticating…' : 'Sign in to Admin Panel'}
            </motion.button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <Link to="/student" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors">
              <GraduationCap size={14} />
              Not an Admin? Go to Student Portal →
            </Link>
          </div>

          <p className="text-center text-xs text-slate-600 mt-4">
            This portal is restricted to authorized administrators only.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

