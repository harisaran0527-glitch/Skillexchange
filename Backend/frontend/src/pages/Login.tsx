import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-8 rounded-2xl shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">S</div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="you@college.edu"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
              <input
                id="password" name="password" type="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 font-medium hover:underline">Create one</Link>
          </p>
        </motion.div>
      </div>
    </MainLayout>
  )
}
