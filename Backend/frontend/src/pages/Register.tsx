import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Building, BookOpen, Calendar, Image, Eye, EyeOff } from 'lucide-react'

// ── Department → Section mapping ────────────────────────
const DEPARTMENT_SECTIONS: Record<string, string[]> = {
  'AI&DS': ['A', 'B', 'C'],
  'CSE':   ['A', 'B', 'C'],
  'AIML':  ['A', 'B'],
  'IT':    ['A', 'B'],
  'EEE':   ['A'],
  'BME':   ['A'],
  'CIVIL': ['A'],
  'MECH': ['A'],
}

const DEPARTMENTS = Object.keys(DEPARTMENT_SECTIONS)

const YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year']

export default function Register() {
  const { register, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', section: '', year: '', college: '', profileImage: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')

  // Dependent sections based on selected department
  const availableSections = useMemo(() => {
    return form.department ? (DEPARTMENT_SECTIONS[form.department] || []) : []
  }, [form.department])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (name === 'department') {
      // Reset section when department changes
      setForm(prev => ({ ...prev, department: value, section: '' }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }
    try {
      await register({
        name: form.name, email: form.email, password: form.password,
        department: form.department, section: form.section,
        year: form.year, college: form.college, profileImage: form.profileImage
      })
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.05))' }}
        >
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative z-10 bg-white/5 dark:bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                <User size={28} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Create Account</h2>
              <p className="text-slate-400 mt-2">Join SkillSwap and start learning from peers</p>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="mb-6 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image URL */}
              <div>
                <label htmlFor="profileImage" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Image size={14} className="text-indigo-400" /> Profile Image URL
                </label>
                <input id="profileImage" name="profileImage" value={form.profileImage} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="https://example.com/photo.jpg" />
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <User size={14} className="text-indigo-400" /> Full Name *
                  </label>
                  <input id="name" name="name" value={form.name} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="Saran Kumar" autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <Mail size={14} className="text-indigo-400" /> Email *
                  </label>
                  <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    placeholder="you@college.edu" autoComplete="email" />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <Lock size={14} className="text-indigo-400" /> Password *
                  </label>
                  <div className="relative">
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                      className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Min 6 characters" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <Lock size={14} className="text-indigo-400" /> Confirm Password *
                  </label>
                  <div className="relative">
                    <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange}
                      className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="Repeat password" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* College */}
              <div>
                <label htmlFor="college" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Building size={14} className="text-indigo-400" /> College
                </label>
                <input id="college" name="college" value={form.college} onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Your college name" />
              </div>

              {/* Department, Section, Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="department" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <BookOpen size={14} className="text-indigo-400" /> Department
                  </label>
                  <select id="department" name="department" value={form.department} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                    <option value="" className="bg-slate-900">Select Dept...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="section" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <BookOpen size={14} className="text-purple-400" /> Section
                  </label>
                  <select id="section" name="section" value={form.section} onChange={handleChange}
                    disabled={!form.department}
                    className={`w-full px-4 py-3 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer ${form.department ? 'bg-white/5' : 'bg-white/[0.02] opacity-50 cursor-not-allowed'}`}
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                    <option value="" className="bg-slate-900">{form.department ? 'Select Section...' : 'Select Dept first'}</option>
                    {availableSections.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="year" className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                    <Calendar size={14} className="text-indigo-400" /> Year
                  </label>
                  <select id="year" name="year" value={form.year} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                    <option value="" className="bg-slate-900">Select Year...</option>
                    {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
