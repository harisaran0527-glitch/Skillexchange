import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Award, Calendar, X, BookOpen } from 'lucide-react'

interface CompletedCoursesModalProps {
  isOpen: boolean
  onClose: () => void
  studentName: string
  courses: string[]
}

export default function CompletedCoursesModal({ isOpen, onClose, studentName, courses }: CompletedCoursesModalProps) {
  // We simulate date, level, and certificate for the UI since they aren't fully modeled in DB
  const getSimulatedData = (courseName: string, index: number) => {
    const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    const hasCert = index % 2 === 0
    
    // Create a deterministic but somewhat varied date based on the index
    const date = new Date()
    date.setMonth(date.getMonth() - (index * 3 + 1))
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    // Hash string length to pick a level
    const level = levels[courseName.length % levels.length]

    return { level, hasCert, dateStr }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl rounded-3xl p-1 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.2))' }}
        >
          <div className="bg-slate-900 rounded-[22px] p-6 sm:p-8 h-full relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Completed Courses</h2>
                <p className="text-slate-400 text-sm">
                  Verified skills for <strong className="text-indigo-400">{studentName}</strong>
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="relative z-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {courses.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-700/80 rounded-2xl bg-slate-950/40">
                  <BookOpen size={36} className="mx-auto text-indigo-400/60 mb-2" />
                  <p className="text-slate-400 text-sm font-medium">No completed courses listed.</p>
                </div>
              ) : (
                courses.map((course, idx) => {
                  const { level, hasCert, dateStr } = getSimulatedData(course, idx)
                  
                  return (
                    <motion.div 
                      key={course + idx}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      className="group bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 rounded-2xl p-5 transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                          <Book size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-200 group-hover:text-indigo-400 transition-colors">{course}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                            <span className="px-2 py-1 bg-slate-900 rounded-md text-indigo-300">{level}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {dateStr}</span>
                          </div>
                        </div>
                      </div>
                      
                      {hasCert && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-bold border border-amber-500/20">
                          <Award size={14} /> Certified
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
            
            <style>{`
              .custom-scrollbar::-webkit-scrollbar { width: 6px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 10px; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.6); }
            `}</style>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
