import React, { useState, useEffect, useRef } from 'react'
import MainLayout from '../layouts/main/MainLayout'
import {
  Search, Loader2, Video, FileText, ExternalLink, BookOpen,
  GraduationCap, Star, CheckCircle, Sparkles, ChevronRight, Play
} from 'lucide-react'
import { searchApi, requestApi } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ContextMenu from '../components/ui/ContextMenu'
import CompletedCoursesModal from '../components/CompletedCoursesModal'
import QuestionBankModal from '../components/QuestionBankModal'
import { useAuth } from '../context/AuthContext'

const POPULAR_SEARCH_CHIPS = ['C', 'C++', 'Java', 'Python', 'HTML & CSS']

export default function CourseSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const navigate = useNavigate()

  // Context Menu & Modal state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; student: any } | null>(null)
  const [showCoursesModal, setShowCoursesModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedQbCourse, setSelectedQbCourse] = useState<any>(null)

  // Single-click Teaching Request confirmation state
  const [confirmStudent, setConfirmStudent] = useState<any>(null)
  const [submittingRequest, setSubmittingRequest] = useState(false)

  // Long press refs for mobile
  const touchTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressTriggered = useRef<boolean>(false)

  const [apiError, setApiError] = useState<string | null>(null)

  // Live search effect
  useEffect(() => {
    const trimmed = query.trim()
    const delay = setTimeout(() => {
      setLoading(true)
      if (trimmed.length > 0) {
        searchApi.getSuggestions(trimmed).then(setSuggestions).catch(() => {})
      } else {
        setSuggestions([])
      }

      searchApi.searchByCourse(trimmed)
        .then(res => {
          setResults(res.students || [])
          setCourses(res.courses || [])
          setApiError(null)
        })
        .catch(err => {
          console.error(err)
          setApiError(err.message || 'Failed to load course data')
        })
        .finally(() => setLoading(false))
    }, 200)

    return () => clearTimeout(delay)
  }, [query])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setShowSuggestions(false)
    const trimmed = query.trim()
    setLoading(true)
    searchApi.searchByCourse(trimmed)
      .then(res => {
        setResults(res.students || [])
        setCourses(res.courses || [])
        setApiError(null)
      })
      .catch(err => {
        console.error(err)
        setApiError(err.message || 'Failed to load course data')
      })
      .finally(() => setLoading(false))
  }

  const selectSuggestion = (name: string) => {
    setQuery(name)
    setShowSuggestions(false)
    setLoading(true)
    searchApi.searchByCourse(name)
      .then(res => {
        setResults(res.students || [])
        setCourses(res.courses || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  // Handle right-click (desktop)
  const handleContextMenu = (e: React.MouseEvent, student: any) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, student })
  }

  // Handle long-press (mobile)
  const handleTouchStart = (e: React.TouchEvent, student: any) => {
    longPressTriggered.current = false
    touchTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setSelectedStudent(student)
      setShowCoursesModal(true)
    }, 550)
  }

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current)
  }

  const handleTouchMove = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current)
  }

  const handleCardClick = (student: any) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    setConfirmStudent(student)
  }

  const handleConfirmTeachingRequest = async () => {
    if (!confirmStudent) return
    setSubmittingRequest(true)
    const courseRequested = query.trim() || 'Course'
    try {
      await requestApi.create({
        toUserId: confirmStudent.id || confirmStudent._id,
        skill: courseRequested,
        courseName: courseRequested
      })
      alert(`Teaching request sent to ${confirmStudent.name}! An email notification has been dispatched.`)
      setConfirmStudent(null)
    } catch (err: any) {
      alert(err.message || 'Failed to send teaching request.')
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Defensive frontend filter: Exclude logged-in student from teacher list
  const currentUserId = (user?.id || (user as any)?._id)?.toString()
  const eligibleStudents = (results || []).filter(s => {
    const sId = (s.id || s._id)?.toString()
    return sId && sId !== currentUserId
  })

  // Selected course for the right panel video & question bank
  const activeCourse = (selectedCourseId && courses.find(c => (c.id || c._id) === selectedCourseId))
    || (courses && courses.length > 0 ? courses[0] : null)

  // YouTube Embed Helper
  const getEmbedUrl = (youtubeUrl?: string) => {
    if (!youtubeUrl) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = youtubeUrl.match(regExp)
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null
  }

  const activeEmbedUrl = activeCourse ? getEmbedUrl(activeCourse.youtubeUrl) : null
  const hasCourses = courses && courses.length > 0
  const hasStudents = eligibleStudents && eligibleStudents.length > 0

  return (
    <MainLayout>
      <div className="space-y-8 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Courses & Skills
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Search courses, learn from peers, and exchange your skills.
          </p>
        </div>

        {/* Search Bar Section */}
        <div className="relative max-w-3xl mx-auto z-40">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-indigo-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              className="block w-full pl-12 pr-32 py-4 bg-[#111322] border border-white/10 rounded-2xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/50 shadow-2xl transition-all"
              placeholder="Search by course name (e.g. C, C++, Java, Python, HTML & CSS)..."
            />
            <button
              type="submit"
              className="absolute inset-y-2 right-2 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Popular Search Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap mt-3">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-400" /> Popular:
            </span>
            {POPULAR_SEARCH_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => selectSuggestion(chip)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all border ${
                  query.toLowerCase() === chip.toLowerCase()
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 shadow-sm'
                    : 'bg-[#111322] text-slate-400 border-white/10 hover:border-indigo-500/40 hover:text-white'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="absolute w-full mt-2 bg-[#111322] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
              >
                {suggestions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => selectSuggestion(s.name)}
                    className="px-5 py-3 cursor-pointer hover:bg-indigo-600/20 border-b border-white/5 last:border-0 flex items-center justify-between group transition-colors"
                  >
                    <span className="text-white font-semibold text-sm group-hover:text-indigo-300">{s.name}</span>
                    <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-bold uppercase">{s.category}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Grid: Left (Course Results & Eligible Students) vs Right (Video & Question Bank) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-slate-400 font-medium text-sm">Searching course directory & student network...</p>
          </div>
        ) : (hasCourses || hasStudents) ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Course Results & Eligible Students */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Matching Courses Cards */}
              {hasCourses && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <BookOpen size={20} className="text-indigo-400" />
                      <span>Available Courses ({courses.length})</span>
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {courses.map((c: any) => {
                      const isSelected = activeCourse && (activeCourse.id || activeCourse._id) === (c.id || c._id)
                      const teachersForCourse = (results || []).filter(s => {
                        const skills = (s.skillsOffered || []).concat(s.completedCourses || []).map((x: string) => x.toLowerCase())
                        return skills.includes(c.name.toLowerCase())
                      })

                      return (
                        <div
                          key={c.id || c._id}
                          onClick={() => setSelectedCourseId(c.id || c._id)}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer bg-[#111322] ${
                            isSelected
                              ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                              : 'border-white/10 hover:border-indigo-500/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-white text-lg hover:text-indigo-400 transition-colors">{c.name}</h3>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                                  {c.category || 'General'}
                                </span>
                              </div>
                              {c.description && (
                                <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCourseId(c.id || c._id)
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-md'
                                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                              }`}
                            >
                              <span>{isSelected ? 'Active Video' : 'Select'}</span>
                              <ChevronRight size={14} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                              <GraduationCap size={14} className="text-indigo-400" />
                              <strong className="text-slate-200">{teachersForCourse.length}</strong> Student Teachers Available
                            </span>
                            {c.youtubeUrl && (
                              <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                                <Video size={13} /> Video Available
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Eligible Students Section */}
              {hasStudents && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <GraduationCap size={20} className="text-indigo-400" />
                      <span>Students Qualified to Teach ({eligibleStudents.length})</span>
                    </h2>
                    <span className="text-xs text-slate-500">Click card to request</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eligibleStudents.map((student, i) => (
                      <motion.div
                        key={student.id || student._id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => handleCardClick(student)}
                        onContextMenu={(e) => handleContextMenu(e, student)}
                        onTouchStart={(e) => handleTouchStart(e, student)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                        className="bg-[#111322] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-5 transition-all flex flex-col justify-between cursor-pointer group shadow-xl relative select-none"
                      >
                        <div>
                          {/* Availability status badge */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${student.availability === 'available' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{student.availability || 'available'}</span>
                            </div>

                            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                              <Star size={13} fill="currentColor" />
                              <span>{student.rating ? student.rating.toFixed(1) : '4.5'}</span>
                            </div>
                          </div>

                          {/* Student identity */}
                          <div className="flex items-center gap-3 mb-4">
                            {student.profileImage ? (
                              <img src={student.profileImage} alt={student.name} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-extrabold text-white text-lg shadow-md">
                                {student.name.charAt(0)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <h3 className="font-bold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">{student.name}</h3>
                              <p className="text-xs text-slate-400 truncate">
                                {student.department || 'Student'}{student.section ? ` - Sec ${student.section}` : ''}{student.year ? ` • Yr ${student.year}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Completed Courses Pills */}
                          {student.completedCourses && student.completedCourses.length > 0 && (
                            <div className="mb-4">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Completed Courses</p>
                              <div className="flex gap-1.5 flex-wrap">
                                {student.completedCourses.slice(0, 3).map((c: string) => (
                                  <span key={c} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-[11px] font-medium rounded-lg border border-emerald-500/20">
                                    {c}
                                  </span>
                                ))}
                                {student.completedCourses.length > 3 && (
                                  <span className="px-2 py-0.5 bg-white/5 text-slate-400 text-[11px] font-medium rounded-lg border border-white/10">
                                    +{student.completedCourses.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedStudent(student)
                              setShowCoursesModal(true)
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors"
                          >
                            View Skills
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfirmStudent(student)
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
                          >
                            Request Session
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* RIGHT COLUMN: Sticky Side Panel — Video & Question Bank */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              
              {/* Learning Video Card */}
              <div className="bg-[#111322] border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                      <Play size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Learning Video</h3>
                      <p className="text-[11px] text-slate-400">{activeCourse ? activeCourse.name : 'Select a course'}</p>
                    </div>
                  </div>

                  {activeCourse && (
                    <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                      {activeCourse.category || 'Tutorial'}
                    </span>
                  )}
                </div>

                {activeEmbedUrl ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg border border-white/10">
                      <iframe
                        src={activeEmbedUrl}
                        title={`${activeCourse?.name} Learning Video`}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-200 truncate">{activeCourse?.name} Video Tutorial</span>
                      {activeCourse?.youtubeUrl && (
                        <a
                          href={activeCourse.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold flex-shrink-0"
                        >
                          <span>Open YouTube</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-[#0d0f1a] rounded-xl border border-white/5 space-y-2">
                    <Video size={32} className="mx-auto text-slate-600" />
                    <p className="text-xs text-slate-400 font-medium">
                      {activeCourse ? `No video tutorial currently attached for ${activeCourse.name}.` : 'Select a course from the list to view its learning video.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Question Bank Card */}
              <div className="bg-[#111322] border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Question Bank</h3>
                      <p className="text-[11px] text-slate-400">{activeCourse ? activeCourse.name : 'Select a course'}</p>
                    </div>
                  </div>
                </div>

                {activeCourse && (activeCourse.questionBankTitle || activeCourse.questionBankUrl || activeCourse.questionBankContent) ? (
                  <div className="p-4 rounded-xl bg-[#0d0f1a] border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 text-xs truncate max-w-[200px]">
                        {activeCourse.questionBankTitle || `${activeCourse.name} Question Bank`}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Available</span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Access practice questions, exam topics, and solution keys stored for this course.
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedQbCourse(activeCourse)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <FileText size={14} />
                        <span>View Question Bank</span>
                      </button>

                      {activeCourse.questionBankUrl && (
                        <a
                          href={activeCourse.questionBankUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl border border-white/10 transition-colors flex items-center gap-1"
                          title="Download Resource"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center bg-[#0d0f1a] rounded-xl border border-white/5 space-y-2">
                    <FileText size={28} className="mx-auto text-slate-600" />
                    <p className="text-xs text-slate-400 font-medium">
                      {activeCourse ? `No Question Bank uploaded for ${activeCourse.name} yet.` : 'Select a course to view its Question Bank.'}
                    </p>
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : apiError ? (
          <div className="text-center py-16 bg-[#111322] rounded-2xl border border-rose-500/30">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-500/20">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Unable to load courses</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">{apiError}</p>
          </div>
        ) : query.trim() && !loading ? (
          <div className="text-center py-16 bg-[#111322] rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-white/10">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No courses or skills found</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              We couldn't find any courses or students matching "{query}". Try searching for another language or tool.
            </p>
          </div>
        ) : !loading ? (
          <div className="text-center py-16 bg-[#111322] rounded-2xl border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3 border border-indigo-500/20">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Explore SkillExchange Courses</h3>
            <p className="text-slate-400 text-xs max-w-md mx-auto">
              Type a course or skill above (e.g., C++, Java, Python, HTML & CSS) to display video tutorials, question banks, and eligible student teachers.
            </p>
          </div>
        ) : null}
      </div>

      {/* Single Click Teaching Request Confirmation Modal */}
      {confirmStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#111322] border border-indigo-500/30 p-6 rounded-2xl max-w-md w-full shadow-2xl text-center space-y-5"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-xl font-black text-white mx-auto shadow-lg shadow-indigo-500/20">
              {confirmStudent.name.charAt(0)}
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">
                Request Teaching Session
              </h3>
              <p className="text-slate-300 text-xs mt-2 leading-relaxed">
                Would you like to send a teaching request to <strong className="text-indigo-400">{confirmStudent.name}</strong> for <strong className="text-purple-400">{query.trim() || 'this course'}</strong>?
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setConfirmStudent(null)}
                disabled={submittingRequest}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTeachingRequest}
                disabled={submittingRequest}
                className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-600/30 active:scale-98 disabled:opacity-50"
              >
                {submittingRequest ? 'Sending…' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
            setConfirmStudent(contextMenu.student)
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

      <QuestionBankModal
        isOpen={!!selectedQbCourse}
        onClose={() => setSelectedQbCourse(null)}
        courseName={selectedQbCourse?.name || ''}
        title={selectedQbCourse?.questionBankTitle}
        url={selectedQbCourse?.questionBankUrl}
        content={selectedQbCourse?.questionBankContent}
      />
    </MainLayout>
  )
}
