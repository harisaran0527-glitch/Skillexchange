import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, ExternalLink, X, BookOpen } from 'lucide-react'

interface QuestionBankModalProps {
  isOpen: boolean
  onClose: () => void
  courseName: string
  title?: string
  url?: string
  content?: string
}

export default function QuestionBankModal({
  isOpen,
  onClose,
  courseName,
  title,
  url,
  content
}: QuestionBankModalProps) {
  if (!isOpen) return null

  const handleDownload = () => {
    if (url) {
      const a = document.createElement('a')
      a.href = url
      a.download = `${courseName.toLowerCase()}_question_bank.pdf`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else if (content) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${courseName.toLowerCase()}_questions.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl p-6 shadow-2xl my-auto text-slate-100 relative"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {title || `${courseName} Question Bank`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <BookOpen size={13} className="text-indigo-400" />
                  <span>Exam Preparation & Practice Questions for {courseName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {url && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="text-emerald-400" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-white">Official Document / PDF</p>
                    <p className="text-xs text-slate-400 truncate max-w-xs">{url}</p>
                  </div>
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <ExternalLink size={14} /> Open Document
                </a>
              </div>
            )}

            {content && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Sample Exam Questions & Notes
                </h4>
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 text-sm font-mono whitespace-pre-wrap leading-relaxed">
                  {content}
                </div>
              </div>
            )}

            {!url && !content && (
              <p className="text-center py-8 text-slate-500 italic text-sm">
                No Question Bank document or questions available yet for this course.
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
            >
              Close
            </button>
            {(url || content) && (
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
              >
                <Download size={16} /> Download Question Bank
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
