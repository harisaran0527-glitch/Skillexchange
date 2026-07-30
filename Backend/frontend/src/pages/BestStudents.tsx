import React, { useState, useEffect, useCallback } from 'react'
import MainLayout from '../layouts/main/MainLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { usersApi, AuthUser } from '../services/api'
import { Search, Loader2, Mail, BookOpen, GraduationCap, X, Check, AlertCircle, Star, Award } from 'lucide-react'

export default function BestStudents() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AuthUser[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Modals / Dialogs states
  const [detailsStudent, setDetailsStudent] = useState<AuthUser | null>(null)
  const [confirmEmailStudent, setConfirmEmailStudent] = useState<AuthUser | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const touchTimer = React.useRef<NodeJS.Timeout | null>(null)
  const isLongPressActive = React.useRef(false)

  const doSearch = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    try {
      const data = await usersApi.search({ q: query } as any)
      const qualified = data
        .filter(s => (s.rating !== undefined ? s.rating : 4.5) >= 4.0)
        .sort((a, b) => (b.rating !== undefined ? b.rating : 4.5) - (a.rating !== undefined ? a.rating : 4.5))
      setResults(qualified)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    doSearch()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => doSearch(), 400)
    return () => clearTimeout(t)
  }, [query, doSearch])

  // Desktop Right Click Handler
  const handleRightClick = (e: React.MouseEvent, student: AuthUser) => {
    e.preventDefault()
    setDetailsStudent(student)
  }

  // Mobile Long Press Handlers
  const handleTouchStart = (student: AuthUser) => {
    isLongPressActive.current = false
    touchTimer.current = setTimeout(() => {
      isLongPressActive.current = true
      setDetailsStudent(student)
    }, 600) // 600ms threshold for long press
  }

  const handleTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
    }
  }

  const handleTouchMove = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current)
    }
  }

  // Single Click / Tap Handler
  const handleSingleClick = (student: AuthUser) => {
    if (isLongPressActive.current) {
      isLongPressActive.current = false
      return
    }
    setConfirmEmailStudent(student)
    setEmailStatus(null)
  }

  // Send Email Handler
  const handleSendEmail = async () => {
    if (!confirmEmailStudent) return
    setSendingEmail(true)
    setEmailStatus(null)
    try {
      const studentId = confirmEmailStudent.id || (confirmEmailStudent as any)._id
      const res = await usersApi.sendEmail(studentId)
      if (res.success || (res as any).message?.includes('processed') || (res as any).message?.includes('sent')) {
        setEmailStatus({ type: 'success', message: 'Email sent successfully!' })
        setTimeout(() => {
          setConfirmEmailStudent(null)
          setEmailStatus(null)
        }, 1500)
      } else {
        setEmailStatus({ type: 'error', message: res.message || 'Failed to send email.' })
      }
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to send email.' })
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Best Students
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-lg mx-auto text-sm md:text-base"
          >
            Top-rated students based on academic performance and ratings. Right-click or long-press for details.
          </motion.p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search student names..."
            className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none backdrop-blur-xl transition-all"
          />
        </div>

        {/* Grid Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-400">
            <Loader2 className="h-10 w-10 animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Loading top-rated students...</p>
          </div>
        ) : results.length === 0 && searched ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Star size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-1">No Best Students Found</h3>
            <p className="text-slate-500 text-sm">No students currently meet the rating requirement (4.0+ rating).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {results.map((s, i) => {
              const ratingVal = s.rating || 4.5
              const isBest = ratingVal >= 4.0

              return (
                <motion.div
                  key={s.id || (s as any)._id || i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}
                  onContextMenu={e => handleRightClick(e, s)}
                  onTouchStart={() => handleTouchStart(s)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onClick={() => handleSingleClick(s)}
                  className="group bg-slate-900/60 border border-blue-500/20 hover:border-blue-500/50 p-6 rounded-3xl transition-all hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] select-none cursor-pointer flex flex-col justify-between items-center text-center relative overflow-hidden active:scale-98 backdrop-blur-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-black text-xl mb-3 shadow-lg shadow-blue-500/20">
                    {s.name?.charAt(0).toUpperCase()}
                  </div>

                  <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors duration-200 mb-1">
                    {s.name}
                  </h3>

                  {/* Rating Display */}
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-3">
                    <Star size={13} fill="currentColor" />
                    <span>{ratingVal.toFixed(1)}</span>
                  </div>

                  {/* Best Student Badge */}
                  {isBest && (
                    <span className="px-3.5 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                      <Award size={13} /> Best Student
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Student Details Modal (Right Click / Long Press) */}
      <AnimatePresence>
        {detailsStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              <button
                onClick={() => setDetailsStudent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                  {detailsStudent.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{detailsStudent.name}</h2>
                  <p className="text-sm text-indigo-400 font-medium">
                    {detailsStudent.department || 'General'} Student
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Completed Courses */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-indigo-400" /> Completed Courses
                  </h4>
                  {detailsStudent.completedCourses && detailsStudent.completedCourses.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {detailsStudent.completedCourses.map(course => (
                        <span key={course} className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
                          {course}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No completed courses listed.</p>
                  )}
                </div>



                {/* Other Relevant Info */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Other Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                      <span className="text-slate-500 block mb-0.5">Section</span>
                      <span className="text-slate-300 font-medium">{detailsStudent.section || '—'}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                      <span className="text-slate-500 block mb-0.5">Year</span>
                      <span className="text-slate-300 font-medium">{detailsStudent.year || '—'}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                      <span className="text-slate-500 block mb-0.5">College</span>
                      <span className="text-slate-300 font-medium truncate block">{detailsStudent.college || '—'}</span>
                    </div>
                    <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
                      <span className="text-slate-500 block mb-0.5">Availability</span>
                      <span className="text-slate-300 font-medium capitalize">{detailsStudent.availability || 'available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email Confirmation Dialog (Single Click / Tap) */}
      <AnimatePresence>
        {confirmEmailStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-2">
                  <Mail size={24} />
                </div>
                
                <h3 className="text-lg font-bold text-white">Send Email?</h3>
                <p className="text-slate-400 text-sm">
                  Do you want to send a connection email to <strong className="text-indigo-400">{confirmEmailStudent.name}</strong>?
                </p>

                {/* Email Status Message */}
                {emailStatus && (
                  <div className={`w-full flex items-center gap-2 p-3 rounded-xl text-sm ${
                    emailStatus.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    {emailStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    <span>{emailStatus.message}</span>
                  </div>
                )}

                <div className="flex w-full gap-3 pt-4">
                  <button
                    disabled={sendingEmail}
                    onClick={() => setConfirmEmailStudent(null)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-semibold rounded-2xl transition-colors border border-slate-700/50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={sendingEmail}
                    onClick={handleSendEmail}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 transition-all flex items-center justify-center gap-2"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  )
}
