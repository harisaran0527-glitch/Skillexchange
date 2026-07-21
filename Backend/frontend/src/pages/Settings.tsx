import React, { useState, useEffect, useMemo } from 'react'
import MainLayout from '../layouts/main/MainLayout'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../services/api'
import { User, Book, Building, Camera } from 'lucide-react'

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

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    name: '', department: '', section: '', year: '', college: '', profileImage: ''
  })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  // Skills & Courses management
  const [skillInput, setSkillInput] = useState('')
  const [skillsOffered, setSkillsOffered] = useState<string[]>([])
  const [completedCourses, setCompletedCourses] = useState<string[]>([])
  
  // Note: Since API doesn't yet have dedicated endpoints for completedCourses and certificates
  // we will just manage skillsOffered via the existing addSkill/removeSkill endpoints,
  // and manage completedCourses via updateProfile payload.
  const [courseInput, setCourseInput] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        department: user.department || '',
        section: user.section || '',
        year: user.year || '',
        college: user.college || '',
        profileImage: user.profileImage || '',
      })
      setSkillsOffered(user.skillsOffered || [])
      setCompletedCourses(user.completedCourses || [])
    }
  }, [user])

  const availableSections = useMemo(() => {
    return form.department ? (DEPARTMENT_SECTIONS[form.department] || []) : []
  }, [form.department])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSavedMsg('')
    try {
      await usersApi.updateProfile({
        ...form,
        completedCourses
      })
      await refreshUser()
      setSavedMsg('Profile saved successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function addSkill() {
    const skill = skillInput.trim()
    if (!skill) return
    try {
      const resp = await usersApi.addSkill('offered', skill)
      setSkillsOffered(resp.user.skillsOffered || [])
      setSkillInput('')
      await refreshUser()
      setSavedMsg('Skill added successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to add skill')
    }
  }

  async function removeSkill(skill: string) {
    try {
      const resp = await usersApi.removeSkill('offered', skill)
      setSkillsOffered(resp.user.skillsOffered || [])
      await refreshUser()
      setSavedMsg('Skill removed successfully!')
      setTimeout(() => setSavedMsg(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to remove skill')
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Edit Profile</h1>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                <h2 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                  <User size={18} className="text-indigo-400" /> Basic Information
                </h2>
                
                <form id="profileForm" onSubmit={handleSave} className="space-y-5">
                  {/* Name & Profile Image */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block">Full Name</label>
                      <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Camera size={14}/> Profile Image URL</label>
                      <input value={form.profileImage} onChange={e => setForm(p => ({ ...p, profileImage: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="https://..." />
                    </div>
                  </div>

                  {/* Demographics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block">Department</label>
                      <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value, section: '' }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="" className="bg-slate-900">Select...</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block">Section</label>
                      <select value={form.section} onChange={e => setForm(p => ({ ...p, section: e.target.value }))} disabled={!form.department}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="" className="bg-slate-900">Select...</option>
                        {availableSections.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-2 block">Year</label>
                      <select value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer">
                        <option value="" className="bg-slate-900">Select...</option>
                        {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* College */}
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5"><Building size={14}/> College</label>
                    <input value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Your college" />
                  </div>
                </form>
              </div>

              {/* Completed Courses Management */}
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
                <h2 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                  <Book size={18} className="text-emerald-400" /> Completed Courses
                </h2>
                <div className="flex gap-2 mb-4">
                  <input
                    value={courseInput}
                    onChange={e => setCourseInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCourse())}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="e.g. Advanced Data Structures"
                  />
                  <button onClick={handleAddCourse} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {completedCourses.map(c => (
                    <span key={c} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-sm font-semibold rounded-lg border border-emerald-500/20 flex items-center gap-2">
                      {c}
                      <button onClick={() => handleRemoveCourse(c)} className="text-emerald-400/50 hover:text-emerald-400 text-lg leading-none">&times;</button>
                    </span>
                  ))}
                  {completedCourses.length === 0 && <span className="text-slate-500 text-sm">No courses added yet.</span>}
                </div>
                <p className="text-xs text-slate-500 mt-4 italic">* Course updates will be saved when you click "Save All Changes" below.</p>
              </div>
            </div>

            {/* Right Column: Skills */}
            <div className="space-y-6">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-3xl p-6 md:p-8 backdrop-blur-xl h-full flex flex-col">
                <h2 className="font-bold text-lg text-white mb-6 flex items-center gap-2">
                  <span className="text-indigo-400 font-serif italic text-xl">S</span> Skills Offered
                </h2>
                
                <div className="flex gap-2 mb-6">
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="e.g. React, Python..."
                  />
                  <button onClick={addSkill} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all text-sm">Add</button>
                </div>

                <div className="flex-1">
                  {skillsOffered.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-10">No skills added yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skillsOffered.map(s => (
                        <span key={s} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-sm font-semibold rounded-lg border border-indigo-500/20 flex items-center gap-2">
                          {s}
                          <button onClick={() => removeSkill(s)} className="text-indigo-400/50 hover:text-indigo-400 text-lg leading-none">&times;</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-4 italic">* Skills are saved instantly.</p>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" form="profileForm" disabled={saving} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  )
}
