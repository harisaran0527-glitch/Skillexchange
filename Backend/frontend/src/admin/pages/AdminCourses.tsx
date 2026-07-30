import { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { adminCoursesApi, Course } from '../services/adminApi'
import { Search, Plus, Edit2, Trash2, Video, FileText, ExternalLink, Play, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionBankModal from '../../components/QuestionBankModal'

const CATEGORIES = ['General', 'Programming', 'Web Development', 'Data Science', 'Design', 'AI & ML', 'Cybersecurity', 'Database']
const PRESET_COURSES = [
  { name: 'C', category: 'Programming', icon: '⚙️' },
  { name: 'C++', category: 'Programming', icon: '🔧' },
  { name: 'Java', category: 'Programming', icon: '☕' },
  { name: 'Python', category: 'Programming', icon: '🐍' },
  { name: 'JavaScript', category: 'Web Development', icon: '🟡' },
  { name: 'React', category: 'Web Development', icon: '⚛️' },
  { name: 'SQL', category: 'Database', icon: '🗄️' },
]

const emptyForm = {
  name: '',
  description: '',
  category: 'Programming',
  icon: '📘',
  youtubeUrl: '',
  questionBankTitle: '',
  questionBankUrl: '',
  questionBankContent: ''
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null
}

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [selectedQbCourse, setSelectedQbCourse] = useState<Course | null>(null)

  const handleDownloadQb = (course: Course) => {
    if (course.questionBankUrl) {
      const a = document.createElement('a')
      a.href = course.questionBankUrl
      a.download = `${course.name.toLowerCase()}_question_bank.pdf`
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else if (course.questionBankContent) {
      const blob = new Blob([course.questionBankContent], { type: 'text/plain;charset=utf-8' })
      const downloadUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = `${course.name.toLowerCase()}_questions.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(downloadUrl)
    }
  }

  const handleRemoveQb = async (course: Course) => {
    if (!confirm(`Are you sure you want to remove the Question Bank from ${course.name}?`)) return
    const id = course._id || course.id!
    await adminCoursesApi.update(id, {
      questionBankTitle: '',
      questionBankUrl: '',
      questionBankContent: ''
    })
    load()
  }

  const load = async () => {
    setLoading(true)
    try {
      setCourses(await adminCoursesApi.getAll())
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = courses.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'All' || c.category === selectedCat
    return matchSearch && matchCat
  })

  const openAdd = () => { setEditCourse(null); setForm(emptyForm); setShowModal(true) }
  const openEdit = (c: Course) => {
    setEditCourse(c)
    setForm({
      name: c.name,
      description: c.description || '',
      category: c.category || 'Programming',
      icon: c.icon || '📘',
      youtubeUrl: c.youtubeUrl || '',
      questionBankTitle: c.questionBankTitle || '',
      questionBankUrl: c.questionBankUrl || '',
      questionBankContent: c.questionBankContent || ''
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editCourse) {
        await adminCoursesApi.update(editCourse._id || editCourse.id!, form)
      } else {
        await adminCoursesApi.create(form)
      }
      await load()
      setShowModal(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course and its resources?')) return
    try {
      await adminCoursesApi.delete(id)
      setCourses(c => c.filter(x => (x._id || x.id) !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <AdminLayout title="Course Resources & Question Banks">
      {/* Top Bar */}
      <div className="admin-card p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="admin-search-wrapper flex-1 min-w-[200px] max-w-[400px]">
            <Search size={16} className="admin-search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="admin-input admin-search-input w-full"
            />
          </div>
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="admin-input py-2 bg-[#181b2e] text-slate-200 border border-white/10 rounded-xl"
          >
            <option value="All" className="bg-[#181b2e] text-slate-200">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#181b2e] text-slate-200">{c}</option>)}
          </select>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Add Course Resource
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 rounded-2xl admin-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card rounded-2xl p-12 text-center">
          <Video size={40} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-300 font-semibold text-base">No Course Resources Found</p>
          <p className="text-slate-500 text-sm mt-1">Add courses along with YouTube learning videos & Question Banks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(course => {
            const courseId = course._id || course.id!
            const embedUrl = getYouTubeEmbedUrl(course.youtubeUrl || '')

            return (
              <div key={courseId} className="admin-card rounded-2xl overflow-hidden flex flex-col justify-between border border-white/5 hover:border-indigo-500/30 transition-all">
                <div>
                  {/* Video Embed or Thumbnail Header */}
                  {embedUrl ? (
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={embedUrl}
                        title={course.name}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-r from-indigo-900/40 to-slate-900 flex items-center justify-center p-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{course.icon || '📘'}</span>
                        <div>
                          <h3 className="text-lg font-bold text-white">{course.name}</h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-400">
                            {course.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    {embedUrl && (
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <span>{course.icon || '📘'}</span>
                          <span>{course.name}</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-400">
                          {course.category}
                        </span>
                      </div>
                    )}

                    {course.description && (
                      <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">{course.description}</p>
                    )}

                    {/* Resources Badges & Actions */}
                    <div className="space-y-2.5">
                      {/* YouTube Video Link */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <Video size={15} className="text-red-400" />
                          <span className="font-semibold text-slate-300">Learning Video</span>
                        </div>
                        {course.youtubeUrl ? (
                          <a href={course.youtubeUrl} target="_blank" rel="noreferrer" className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1 transition-colors">
                            Watch <ExternalLink size={12} />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-600">Not Added</span>
                        )}
                      </div>

                      {/* Question Bank */}
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <FileText size={15} className="text-emerald-400" />
                            <span className="font-semibold text-slate-300 truncate max-w-[160px]">
                              {course.questionBankTitle || 'Question Bank'}
                            </span>
                          </div>
                          {course.questionBankUrl || course.questionBankContent ? (
                            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 uppercase">
                              Ready
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-600">Not Added</span>
                          )}
                        </div>

                        {(course.questionBankUrl || course.questionBankContent) && (
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <button
                              onClick={() => setSelectedQbCourse(course)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1 transition-colors flex-1 justify-center"
                            >
                              <FileText size={12} /> View / Open
                            </button>
                            <button
                              onClick={() => handleDownloadQb(course)}
                              className="px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-medium flex items-center gap-1 transition-colors"
                              title="Download Question Bank"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => handleRemoveQb(course)}
                              className="p-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs"
                              title="Remove Question Bank"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-white/5 bg-slate-900/30 flex items-center justify-end gap-2">
                  <button
                    onClick={() => openEdit(course)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 size={13} /> Manage Resources
                  </button>
                  <button
                    onClick={() => handleDelete(courseId)}
                    className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                    title="Delete Course"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="admin-card w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-indigo-500/20 my-auto"
            >
              <h2 className="text-xl font-bold text-white mb-4">
                {editCourse ? `Edit ${editCourse.name} Resources` : 'Add Course Learning Resources'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Course Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="admin-input"
                      placeholder="e.g. C, C++, Java, Python"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="admin-input bg-[#181b2e] text-slate-200"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#181b2e] text-slate-200">{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="admin-input h-20 resize-none"
                    placeholder="Short summary of what students will learn..."
                  />
                </div>

                <div className="pt-2 border-t border-white/5">
                  <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center gap-1.5">
                    <Video size={16} /> <span>YouTube Learning Video</span>
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">YouTube Video URL</label>
                    <input
                      type="url"
                      value={form.youtubeUrl}
                      onChange={e => setForm({ ...form, youtubeUrl: e.target.value })}
                      className="admin-input"
                      placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5">
                  <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1.5">
                    <FileText size={16} /> <span>Question Bank</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Question Bank Title</label>
                      <input
                        type="text"
                        value={form.questionBankTitle}
                        onChange={e => setForm({ ...form, questionBankTitle: e.target.value })}
                        className="admin-input"
                        placeholder="e.g. C Programming Question Bank PDF"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">PDF / Document File URL</label>
                      <input
                        type="url"
                        value={form.questionBankUrl}
                        onChange={e => setForm({ ...form, questionBankUrl: e.target.value })}
                        className="admin-input"
                        placeholder="e.g. https://example.com/c_question_bank.pdf"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Questions / Notes Content</label>
                      <textarea
                        value={form.questionBankContent}
                        onChange={e => setForm({ ...form, questionBankContent: e.target.value })}
                        className="admin-input h-24 resize-none"
                        placeholder="Type or paste sample questions / key exam questions here..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    {saving ? 'Saving...' : editCourse ? 'Update Course Resources' : 'Save Course Resources'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Question Bank Modal */}
      {selectedQbCourse && (
        <QuestionBankModal
          isOpen={!!selectedQbCourse}
          onClose={() => setSelectedQbCourse(null)}
          courseName={selectedQbCourse.name}
          title={selectedQbCourse.questionBankTitle}
          url={selectedQbCourse.questionBankUrl}
          content={selectedQbCourse.questionBankContent}
        />
      )}
    </AdminLayout>
  )
}

