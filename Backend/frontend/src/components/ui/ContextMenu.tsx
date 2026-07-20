import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, Award, CalendarPlus, User, X } from 'lucide-react'

interface ContextMenuProps {
  x: number
  y: number
  onClose: () => void
  onViewCourses: () => void
  onViewCertificates: () => void
  onBookSession: () => void
  onViewProfile: () => void
  studentName: string
}

export default function ContextMenu({ x, y, onClose, onViewCourses, onViewCertificates, onBookSession, onViewProfile, studentName }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Adjust position to stay within viewport
  const getAdjustedPosition = () => {
    if (!menuRef.current) return { left: x, top: y }
    const rect = menuRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let left = x
    let top = y

    // Right edge collision
    if (x + rect.width > viewportWidth) left = viewportWidth - rect.width - 10
    // Bottom edge collision
    if (y + rect.height > viewportHeight) top = viewportHeight - rect.height - 10

    return { left, top }
  }

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Timeout to prevent immediate closing on trigger
    const timeout = setTimeout(() => {
      window.addEventListener('click', handleClickOutside)
      window.addEventListener('touchstart', handleClickOutside)
      window.addEventListener('contextmenu', handleClickOutside) // close if another context menu opens
    }, 50)
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('contextmenu', handleClickOutside)
    }
  }, [onClose])

  // Prevent scroll when context menu is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [])

  return (
    <AnimatePresence>
      {/* Invisible overlay to catch clicks */}
      <div className="fixed inset-0 z-[100]" />
      
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-[101] w-64 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] border border-slate-700/50 bg-slate-800/90 backdrop-blur-xl overflow-hidden"
        style={getAdjustedPosition()}
      >
        <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions for</p>
          <p className="text-sm font-bold text-white truncate">{studentName}</p>
        </div>

        <div className="p-1.5 flex flex-col gap-1">
          <button 
            onClick={() => { onViewCourses(); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-500/20 text-slate-200 hover:text-indigo-300 transition-colors text-sm font-medium text-left"
          >
            <Book size={16} /> View Completed Courses
          </button>
          
          <button 
            onClick={() => { onViewCertificates(); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-500/20 text-slate-200 hover:text-amber-400 transition-colors text-sm font-medium text-left"
          >
            <Award size={16} /> View Certificates
          </button>
          
          <button 
            onClick={() => { onBookSession(); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-400 transition-colors text-sm font-medium text-left"
          >
            <CalendarPlus size={16} /> Book Learning Session
          </button>
          
          <button 
            onClick={() => { onViewProfile(); onClose() }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700 text-slate-200 transition-colors text-sm font-medium text-left"
          >
            <User size={16} /> View Profile
          </button>

          <div className="h-px bg-slate-700/50 my-1 mx-2" />

          <button 
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors text-sm font-medium text-left"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
