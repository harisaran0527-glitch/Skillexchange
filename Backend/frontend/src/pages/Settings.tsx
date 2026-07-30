import React, { useState, useEffect } from 'react'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../services/api'
import { User, Book, Building, Lock } from 'lucide-react'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  // Completed Courses management only
  const [completedCourses, setCompletedCourses] = useState<string[]>([])
  const [courseInput, setCourseInput] = useState('')

  useEffect(() => {
    if (user) {
      setCompletedCourses(user.completedCourses || [])
    }
  }, [user])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSavedMsg('')
    try {
      await usersApi.updateProfile({
        completedCourses
      })
      await refreshUser()
      setSavedMsg('Course selections saved successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  function handleAddCourse() {
    const course = courseInput.trim()
    if (!course) return
    if (!completedCourses.includes(course)) {
      setCompletedCourses(prev => [...prev, course])
    }
    setCourseInput('')
  }

  function handleRemoveCourse(course: string) {
    setCompletedCourses(prev => prev.filter(c => c !== course))
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Student Profile & Course Selection
            </h1>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
              <Lock size={13} /> Admin Managed Profile
            </span>
          </div>

          {savedMsg && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-medium">
              ✅ {savedMsg}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-medium">
              ❌ {error}
            </motion.div>
          )}

          <div className="space-y-6">
            
            {/* Basic Information (Read-Only) */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                  <User size={18} className="text-indigo-400" /> Personal Information
                </h2>
                <span className="text-xs text-slate-500 italic">Editable only by Admin</span>
              </div>
              
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">Full Name</label>
                    <input value={user?.name || ''} readOnly disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 cursor-not-allowed opacity-80" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">Student Email</label>
                    <input value={user?.email || ''} readOnly disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 cursor-not-allowed opacity-80" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">Department</label>
                    <input value={user?.department || '—'} readOnly disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 cursor-not-allowed opacity-80" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">Section</label>
                    <input value={user?.section ? `Section ${user.section}` : '—'} readOnly disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 cursor-not-allowed opacity-80" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block">Year</label>
                    <input value={user?.year ? `Year ${user.year}` : '—'} readOnly disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 cursor-not-allowed opacity-80" />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Building size={14}/> College Name</label>
                  <input value={user?.college || 'AVS ENGINEERING COLLEGE'} readOnly disabled className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 cursor-not-allowed opacity-80" />
                </div>
              </div>
            </div>

            {/* Completed Courses Management (Student Editable) */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
              <h2 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
                <Book size={18} className="text-emerald-400" /> Course / Skill Selection
              </h2>
              <p className="text-xs text-slate-400 mb-6">Select or add courses you are currently enrolled in or have completed.</p>
              
              <div className="flex gap-2 mb-4">
                <input
                  value={courseInput}
                  onChange={e => setCourseInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCourse())}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                  placeholder="e.g. C++, Java, Python, React"
                />
                <button type="button" onClick={handleAddCourse} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm">Add Course</button>
              </div>

              <div className="flex flex-wrap gap-2">
                {completedCourses.map(c => (
                  <span key={c} className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-semibold rounded-lg border border-emerald-500/20 flex items-center gap-2">
                    {c}
                    <button type="button" onClick={() => handleRemoveCourse(c)} className="text-emerald-400/50 hover:text-emerald-400 text-lg leading-none">&times;</button>
                  </span>
                ))}
                {completedCourses.length === 0 && <span className="text-slate-500 text-sm italic">No courses selected yet.</span>}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={handleSave} disabled={saving} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Course Selection'}
            </button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
