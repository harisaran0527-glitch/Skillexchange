import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { usersApi, AuthUser } from '../services/api'
import { Search, Filter, X, ChevronDown, Star, Loader2 } from 'lucide-react'
import ContextMenu from '../components/ui/ContextMenu'
import CompletedCoursesModal from '../components/CompletedCoursesModal'
import BookSessionModal from '../components/BookSessionModal'
import { requestApi } from '../services/api'

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
const AVAILABILITY_OPTIONS = ['available', 'busy', 'offline']

export default function Discovery() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Advanced Filters
  const [filters, setFilters] = useState({
    department: '', section: '', year: '', availability: ''
  })

  const availableSections = useMemo(() => {
    return filters.department ? (DEPARTMENT_SECTIONS[filters.department] || []) : []
  }, [filters.department])

  // Context Menu & Modals
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, student: any } | null>(null)
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const touchTimer = React.useRef<NodeJS.Timeout | null>(null)

  const doSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const data = await usersApi.search({
        q: query,
        department: filters.department,
        section: filters.section,
        year: filters.year,
        availability: filters.availability
      } as any)
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, filters])

  useEffect(() => { doSearch() }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(), 400)
    return () => clearTimeout(t)
  }, [query, filters])

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'department') {
      setFilters(prev => ({ ...prev, department: value, section: '' }))
    } else {
      setFilters(prev => ({ ...prev, [key]: value }))
    }
  }

  const clearFilters = () => {
    setFilters({ department: '', section: '', year: '', availability: '' })
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, student: any) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, student })
  }
  const handleTouchStart = (e: React.TouchEvent, student: any) => {
    const touch = e.touches[0]
    touchTimer.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY, student })
    }, 600)
  }
  const handleTouchEnd = () => { if (touchTimer.current) clearTimeout(touchTimer.current) }
  const handleTouchMove = () => { if (touchTimer.current) clearTimeout(touchTimer.current) }

  const handleBookSession = async () => {
    if (!selectedStudent) return
    try {
      await requestApi.create({
        toUserId: selectedStudent.id || (selectedStudent as any)._id,
        skill: selectedStudent.skillsOffered?.[0] || 'General',
        courseName: selectedStudent.completedCourses?.[0] || 'General'
      })
      alert('Request sent successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to send request.')
    }
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500'
      case 'busy': return 'bg-amber-500'
      default: return 'bg-slate-500'
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

          {/* Hero Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
              Discover Skills
            </h1>
            <p className="text-slate-400 max-w-lg mx-auto">Find students by name, course, department, and more. Right-click or long-press a card for actions.</p>
          </div>

          {/* Search + Filter Toggle */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by student name or course..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/60 border border-indigo-500/30 rounded-2xl text-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none backdrop-blur-xl shadow-xl transition-all"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-4 rounded-2xl border transition-all flex items-center gap-2 font-medium ${showFilters ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-indigo-500/50'}`}
              >
                <Filter size={20} />
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 bg-indigo-400 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{activeFilterCount}</span>
                )}
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-6 bg-slate-900/60 border border-slate-700/50 rounded-2xl backdrop-blur-xl space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Advanced Filters</h3>
                      {activeFilterCount > 0 && (
                        <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium">
                          <X size={12} /> Clear All
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Department */}
                      <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Department</label>
                        <select value={filters.department} onChange={e => handleFilterChange('department', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                          <option value="" className="bg-slate-900">All</option>
                          {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                        </select>
                      </div>
                      {/* Section */}
                      <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Section</label>
                        <select value={filters.section} onChange={e => handleFilterChange('section', e.target.value)}
                          disabled={!filters.department}
                          className={`w-full px-3 py-2.5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer ${filters.department ? 'bg-white/5' : 'bg-white/[0.02] opacity-50 cursor-not-allowed'}`}
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                          <option value="" className="bg-slate-900">All</option>
                          {availableSections.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                        </select>
                      </div>
                      {/* Year */}
                      <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Year</label>
                        <select value={filters.year} onChange={e => handleFilterChange('year', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                          <option value="" className="bg-slate-900">All</option>
                          {YEARS.map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                        </select>
                      </div>
                      {/* Availability */}
                      <div>
                        <label className="text-xs font-semibold text-slate-400 mb-1 block">Availability</label>
                        <select value={filters.availability} onChange={e => handleFilterChange('availability', e.target.value)}
                          className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                          <option value="" className="bg-slate-900">All</option>
                          {AVAILABILITY_OPTIONS.map(a => <option key={a} value={a} className="bg-slate-900 capitalize">{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Searching students...</p>
            </div>
          ) : results.length === 0 && searched ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
              <span className="text-6xl block mb-4">🔍</span>
              <h3 className="text-xl font-bold text-slate-300 mb-2">No students found</h3>
              <p className="text-slate-500">Try a different search term or adjust your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((s: any, i) => (
                <motion.div
                  key={s.id || s._id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i }}
                  onContextMenu={e => handleContextMenu(e, s)}
                  onTouchStart={e => handleTouchStart(e, s)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  className="group bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-3xl transition-all hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] select-none cursor-pointer relative"
                >
                  {/* Availability indicator */}
                  <div className="absolute top-5 right-5 flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${getAvailabilityColor(s.availability || 'available')}`} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.availability || 'available'}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-5">
                    {s.profileImage ? (
                      <img src={s.profileImage} alt={s.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                        {s.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{s.name}</h3>
                      <p className="text-sm text-slate-400">
                        {s.department}{s.section ? ` - ${s.section}` : ''}{s.year ? ` • ${s.year}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Completed Courses Count */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Completed Courses</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-emerald-400">{s.completedCourses?.length || 0}</span>
                      <span className="text-sm text-slate-400">courses completed</span>
                    </div>
                  </div>

                  <div className="w-full text-center py-2 mt-4 text-xs font-medium text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity">
                    Right-click or long-press for options
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y}
          studentName={contextMenu.student.name}
          onClose={() => setContextMenu(null)}
          onViewCourses={() => { setSelectedStudent(contextMenu.student); setShowCoursesModal(true) }}
          onViewCertificates={() => { setSelectedStudent(contextMenu.student); setShowCoursesModal(true) }}
          onBookSession={() => { setSelectedStudent(contextMenu.student); setShowBookModal(true) }}
          onViewProfile={() => { navigate(`/student/${contextMenu.student.id || contextMenu.student._id}`) }}
        />
      )}

      {/* Modals */}
      <CompletedCoursesModal
        isOpen={showCoursesModal}
        onClose={() => setShowCoursesModal(false)}
        studentName={selectedStudent?.name || ''}
        courses={selectedStudent?.completedCourses || []}
      />
      <BookSessionModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onContinue={handleBookSession}
        studentName={selectedStudent?.name || ''}
        courseName={selectedStudent?.completedCourses?.[0] || 'General'}
      />
    </MainLayout>
  )
}
