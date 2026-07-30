import React from 'react'
import { Calendar } from 'lucide-react'

interface BookSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  studentName: string
  courseName: string
}

export default function BookSessionModal({ isOpen, onClose, onContinue, studentName, courseName }: BookSessionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden bg-slate-900 border border-indigo-500/30"
      >
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
            <Calendar size={28} className="text-indigo-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Book Learning Session</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            You are about to request a learning session with <strong className="text-indigo-400">{studentName}</strong> for <strong className="text-emerald-400">{courseName}</strong>. They will receive an email notification.
          </p>
          
          <div className="flex gap-3 justify-center">
            <button 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Cancel
            </button>
            <button 
              onClick={() => { onContinue(); onClose() }} 
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
