import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, Shield, GraduationCap } from 'lucide-react'

export default function Login() {
  const { login, token, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Student sign in failed. Please check your credentials.')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-slate-900/60 border border-blue-500/20 p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden"
        >
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Student Sign In</h2>
              <p className="text-xs font-semibold text-blue-400">SkillExchange Student Portal</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Student Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-purple-500/50 transition-all text-sm" placeholder="student@college.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Password</label>
              <div className="relative">
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-purple-500/50 transition-all text-sm pr-10" placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-600/30 active:scale-98 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In to Student Portal'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm">
            <p className="text-slate-400 text-xs">
              Don't have a student account?{' '}
              <Link to="/register" className="font-bold text-blue-400 hover:text-blue-300">
                Register here
              </Link>
            </p>
          </div>

        </motion.div>
      </div>
    </MainLayout>
  )
}

