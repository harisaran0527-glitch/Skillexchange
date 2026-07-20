import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { usersApi, requestApi } from '../services/api'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Book, Star, ExternalLink, Mail, CheckCircle2 } from 'lucide-react'
import BookSessionModal from '../components/BookSessionModal'
import { useAuth } from '../context/AuthContext'

export default function StudentProfileView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showBookModal, setShowBookModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [requested, setRequested] = useState(false)
  const [toastMessage, setToastMessage] = useState<any>(null)

  useEffect(() => {
    if (id) {
      usersApi.getUserById(id)
        .then(setStudent)
        .catch(err => { console.error(err); navigate('/search') })
        .finally(() => setLoading(false))
    }
  }, [id, navigate])

  const handleBookSession = (course: string) => {
    setSelectedCourse(course)
    setShowBookModal(true)
  }

  const submitRequest = async () => {
    try {
      await requestApi.create({
        toUserId: student.id,
        skill: selectedCourse,
        courseName: selectedCourse
      })
      setRequested(true)
      setToastMessage({
        title: 'Request Sent Successfully',
        desc: 'Your learning request has been sent successfully.',
        tutor: student.name,
        course: selectedCourse,
        status: 'Waiting for Approval'
      })
      setTimeout(() => setToastMessage(null), 5000)
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" /></div>
      </MainLayout>
    )
  }

  if (!student) return null

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={18} /> Back to search
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-indigo-500/20 transform rotate-3">
                {student.name.charAt(0)}
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{student.name}</h1>
                    <p className="text-indigo-400 font-medium text-lg">
                      {student.department}
                      {student.section ? ` - Sec ${student.section}` : ''}
                      {student.year ? ` • Year ${student.year}` : ''}
                    </p>
                  </div>
                  {student.id !== currentUser?.id && (
                    <button 
                      onClick={() => handleBookSession(student.skillsOffered[0] || 'General')}
                      disabled={requested}
                      className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 ${
                        requested ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed' : 'bg-white text-indigo-900 hover:bg-slate-100 hover:scale-105'
                      }`}
                    >
                      {requested ? <><CheckCircle2 size={18}/> Request Sent</> : 'Book Session'}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-400">
                  <div className="flex items-center gap-2"><MapPin size={16} /> {student.college || 'College not specified'}</div>
                  <div className="flex items-center gap-2 text-amber-400"><Star size={16} fill="currentColor" /> {student.rating || 'New'} ({student.reviewCount || 0} reviews)</div>
                  <div className="flex items-center gap-2 text-emerald-400"><CheckCircle2 size={16} /> {student.availability || 'Available'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="md:col-span-2 space-y-6">
              {/* Removed About Me section */}

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Skills Offered</h2>
                {student.skillsOffered?.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {student.skillsOffered.map((s: string) => (
                      <button 
                        key={s} 
                        onClick={() => handleBookSession(s)}
                        className="group px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all flex items-center gap-2"
                      >
                        {s}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-white/20 px-2 py-0.5 rounded ml-1">Book</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No skills offered yet.</p>
                )}
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Completed Courses</h2>
                {student.completedCourses?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {student.completedCourses.map((c: string) => (
                      <div key={c} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><Book size={18}/></div>
                        <span className="font-medium text-slate-200">{c}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">No courses marked as completed.</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Removed Skills Needed section */}

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                <h2 className="text-lg font-bold text-white mb-4">Contact & Links</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Mail size={16} /> {student.email}
                  </div>
                  {student.portfolioLinks?.map((link: string, i: number) => (
                    <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300">
                      <ExternalLink size={16} /> Portfolio Link {i+1}
                    </a>
                  ))}
                  {student.socialLinks?.map((link: string, i: number) => (
                    <a key={i} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-indigo-400 hover:text-indigo-300">
                      <ExternalLink size={16} /> Social Profile {i+1}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <BookSessionModal 
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          onContinue={submitRequest}
          studentName={student.name}
          courseName={selectedCourse}
        />
        
        {/* Toast Notification */}
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-2xl max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h4 className="text-white font-bold mb-1">{toastMessage.title}</h4>
                <p className="text-slate-400 text-sm mb-3">{toastMessage.desc}</p>
                <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1.5 border border-slate-700/50">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tutor:</span>
                    <strong className="text-white">{toastMessage.tutor}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Course:</span>
                    <strong className="text-white">{toastMessage.course}</strong>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 border-t border-slate-700">
                    <span className="text-slate-500">Status:</span>
                    <strong className="text-amber-400">{toastMessage.status}</strong>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
