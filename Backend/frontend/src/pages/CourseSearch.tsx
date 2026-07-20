import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { Search, Loader2 } from 'lucide-react'
import { searchApi } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ContextMenu from '../components/ui/ContextMenu'
import CompletedCoursesModal from '../components/CompletedCoursesModal'
import BookSessionModal from '../components/BookSessionModal'
import { requestApi } from '../services/api'

export default function CourseSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, student: any } | null>(null)
  
  // Modals state
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  
  // Long press timer
  const touchTimer = React.useRef<NodeJS.Timeout | null>(null)

  // Fetch suggestions
  useEffect(() => {
    if (query.trim().length > 1) {
      const delay = setTimeout(() => {
        searchApi.getSuggestions(query).then(setSuggestions).catch(() => {})
      }, 300)
      return () => clearTimeout(delay)
    } else {
      setSuggestions([])
    }
  }, [query])

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim()) return
    setShowSuggestions(false)
    setLoading(true)
    try {
      const res = await searchApi.searchByCourse(query)
      setResults(res.students)
      setCourses(res.courses)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectSuggestion = (name: string) => {
    setQuery(name)
    setShowSuggestions(false)
    // small delay to let state update before search
    setTimeout(() => {
      setLoading(true)
      searchApi.searchByCourse(name)
        .then(res => { setResults(res.students); setCourses(res.courses) })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 0)
  }

  // Handle right-click (desktop)
  const handleContextMenu = (e: React.MouseEvent, student: any) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, student })
  }

  // Handle long-press (mobile)
  const handleTouchStart = (e: React.TouchEvent, student: any) => {
    const touch = e.touches[0]
    touchTimer.current = setTimeout(() => {
      setContextMenu({ x: touch.clientX, y: touch.clientY, student })
    }, 600) // 600ms long press
  }

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current)
  }

  const handleTouchMove = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current)
  }

  const handleBookSession = async () => {
    if (!selectedStudent || !query) return
    try {
      await requestApi.create({
        toUserId: selectedStudent.id,
        skill: query,
        courseName: query
      })
      alert('Request sent successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to send request.')
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Search Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Smart Course Search
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Find the perfect peer mentor. Type a course name, language, or tool to instantly find students who can teach you.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto z-40">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-indigo-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="block w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-indigo-500/30 rounded-2xl text-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none backdrop-blur-md shadow-xl transition-all"
              placeholder="e.g. 'Python', 'React', 'Machine Learning'..."
            />
            <button type="submit" className="absolute inset-y-2 right-2 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center">
              Search
            </button>
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="absolute w-full mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {suggestions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => selectSuggestion(s.name)}
                    className="px-4 py-3 cursor-pointer hover:bg-indigo-500/20 border-b border-slate-700/50 last:border-0 flex items-center justify-between group transition-colors"
                  >
                    <span className="text-slate-200 font-medium group-hover:text-indigo-400">{s.name}</span>
                    <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-md">{s.category}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Area */}
        <div className="mt-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p className="text-slate-400 font-medium">Scanning network for matches...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-slate-300">
                Found {results.length} student{results.length > 1 ? 's' : ''} matching "{query}"
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map((student, i) => (
                    <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    onContextMenu={(e) => handleContextMenu(e, student)}
                    onTouchStart={(e) => handleTouchStart(e, student)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchMove}
                    className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition-all hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] flex flex-col select-none relative cursor-pointer"
                  >
                    {/* Availability badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10 pointer-events-none">
                      <div className={`w-2 h-2 rounded-full ${student.availability === 'available' ? 'bg-emerald-500' : student.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{student.availability || 'available'}</span>
                    </div>

                    <div className="absolute inset-0 z-0 bg-transparent rounded-3xl" />
                    <div className="flex items-center gap-4 mb-5 relative z-10 pointer-events-none">
                      {student.profileImage ? (
                        <img src={student.profileImage} alt={student.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{student.name}</h3>
                        <p className="text-sm text-slate-400">{student.department}{student.section ? ` - ${student.section}` : ''} • {student.year || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="mb-4 flex-1 relative z-10 pointer-events-none space-y-3">
                      {/* Completed Courses */}
                      {student.completedCourses && student.completedCourses.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Completed Courses</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {student.completedCourses.slice(0, 3).map((c: string) => (
                              <span key={c} className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20">{c}</span>
                            ))}
                            {student.completedCourses.length > 3 && (
                              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg">+{student.completedCourses.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Skill Level + Rating */}
                      <div className="flex items-center gap-4">
                        <div className="inline-block px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                          Skill Level: {student.skillLevel || 'Intermediate'}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="text-sm font-bold text-amber-400">{student.rating || '0.0'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full text-center py-2 text-xs font-medium text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity relative z-10 pointer-events-none">
                      Right-click or long-press for options
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : query && !loading && !showSuggestions ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-slate-300 mb-2">No exact matches found</h3>
              <p className="text-slate-500">We couldn't find anyone currently offering "{query}". Try adjusting your search term.</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x}
          y={contextMenu.y}
          studentName={contextMenu.student.name}
          onClose={() => setContextMenu(null)}
          onViewCourses={() => {
            setSelectedStudent(contextMenu.student)
            setShowCoursesModal(true)
          }}
          onViewCertificates={() => {
            setSelectedStudent(contextMenu.student)
            setShowCoursesModal(true)
          }}
          onBookSession={() => {
            setSelectedStudent(contextMenu.student)
            setShowBookModal(true)
          }}
          onViewProfile={() => {
            navigate(`/student/${contextMenu.student.id}`)
          }}
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
        courseName={query}
      />
    </MainLayout>
  )
}
