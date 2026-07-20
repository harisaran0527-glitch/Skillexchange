import React, { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import DataTable from '../components/DataTable'
import { adminStudentsApi, adminStudentsExtApi, Student } from '../services/adminApi'
import { Edit2, Ban, CheckCircle, Trash2, Search, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminStudents() {
  const [data, setData] = useState<{ students: Student[]; total: number; page: number; pages: number }>({ students: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  
  const [addingStudent, setAddingStudent] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', department: '', section: '', year: '', college: '', skillsOffered: '', completedCourses: '', profileImage: '' })
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [editForm, setEditForm] = useState<Partial<Student>>({})

  useEffect(() => {
    loadStudents()
  }, [search, department, status, page])

  async function loadStudents() {
    setLoading(true)
    try {
      const resp = await adminStudentsApi.getAll({ q: search, department, status, page, limit: 10 })
      setData(resp)
    } finally {
      setLoading(false)
    }
  }

  async function handleSuspend(id: string) {
    if (!confirm('Are you sure you want to suspend this student?')) return
    await adminStudentsApi.suspend(id)
    loadStudents()
  }

  async function handleActivate(id: string) {
    await adminStudentsApi.activate(id)
    loadStudents()
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you absolutely sure you want to delete this student permanently?')) return
    await adminStudentsApi.delete(id)
    loadStudents()
  }
  
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingStudent) return
    await adminStudentsApi.update(editingStudent._id, editForm)
    setEditingStudent(null)
    loadStudents()
  }

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        ...addForm,
        skillsOffered: addForm.skillsOffered.split(',').map(s => s.trim()).filter(Boolean),
        completedCourses: addForm.completedCourses.split(',').map(s => s.trim()).filter(Boolean)
      }
      await adminStudentsExtApi.create(payload as any)
      setAddingStudent(false)
      setAddForm({ name: '', email: '', password: '', department: '', section: '', year: '', college: '', skillsOffered: '', completedCourses: '', profileImage: '' })
      loadStudents()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const columns = [
    {
      key: 'name', label: 'Student',
      render: (s: Student) => (
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.open(`/student/${s._id}`, '_blank')}>
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs flex-shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            {s.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-200 truncate max-w-[150px] group-hover:text-indigo-400 transition-colors">{s.name}</p>
            <p className="text-xs text-slate-500 truncate max-w-[150px]">{s.email}</p>
          </div>
        </div>
      )
    },
    { key: 'department', label: 'Dept', render: (s: Student) => s.department || '—' },
    { key: 'year', label: 'Year', render: (s: Student) => s.year ? `Year ${s.year}` : '—' },
    {
      key: 'skills', label: 'Skills & Courses',
      render: (s: Student) => (
        <div className="text-xs">
          <span className="text-indigo-400" title="Skills Offered">{s.skillsOffered?.length || 0}</span> / <span className="text-emerald-400" title="Completed Courses">{s.completedCourses?.length || 0}</span>
        </div>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (s: Student) => (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
          s.isSuspended ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
        }`}>
          {s.isSuspended ? 'Suspended' : 'Active'}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: (s: Student) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingStudent(s); setEditForm({ name: s.name, email: s.email, department: s.department, section: s.section, year: s.year, college: s.college }) }} 
            className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors" title="Edit">
            <Edit2 size={14} />
          </button>
          {s.isSuspended ? (
            <button onClick={() => handleActivate(s._id)} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors" title="Activate">
              <CheckCircle size={14} />
            </button>
          ) : (
            <button onClick={() => handleSuspend(s._id)} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-amber-500/20 hover:text-amber-400 transition-colors" title="Suspend">
              <Ban size={14} />
            </button>
          )}
          <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <AdminLayout title="Student Management">
      
      {/* Filters & Actions */}
      <div className="admin-card p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-[400px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" placeholder="Search by name or email..." 
              value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="admin-input pl-9 w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select value={department} onChange={e => { setDepartment(e.target.value); setPage(1) }} className="admin-input py-2">
              <option value="">All Departments</option>
              <option value="AI&DS">AI&DS</option>
              <option value="CSE">CSE</option>
              <option value="AIML">AIML</option>
              <option value="IT">IT</option>
              <option value="EEE">EEE</option>
              <option value="BME">BME</option>
              <option value="CIVIL">CIVIL</option>
              <option value="MECH">MECH</option>
            </select>
            <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="admin-input py-2">
              <option value="">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>
        </div>
        <button onClick={() => setAddingStudent(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Add Student
        </button>
      </div>

      <div className="admin-card rounded-2xl p-1 pb-2">
        <DataTable
          columns={columns}
          data={data.students}
          loading={loading}
          page={data.page}
          pages={data.pages}
          total={data.total}
          onPageChange={setPage}
        />
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="admin-card w-full max-w-md rounded-2xl p-6 shadow-2xl border border-indigo-500/20"
            >
              <h2 className="text-lg font-bold text-white mb-4">Edit Student</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Name</label>
                  <input type="text" value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} className="admin-input" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                  <input type="email" value={editForm.email || ''} onChange={e => setEditForm({...editForm, email: e.target.value})} className="admin-input" required />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select value={editForm.department || ''} onChange={e => setEditForm({...editForm, department: e.target.value})} className="admin-input">
                      <option value="">Select Dept</option>
                      {['AI&DS','CSE','AIML','IT','EEE','BME','CIVIL','MECH'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                    <select value={editForm.section || ''} onChange={e => setEditForm({...editForm, section: e.target.value})} className="admin-input">
                      <option value="">Select Sec</option>
                      {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                    <input type="text" value={editForm.year || ''} onChange={e => setEditForm({...editForm, year: e.target.value})} className="admin-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">College</label>
                  <input type="text" value={editForm.college || ''} onChange={e => setEditForm({...editForm, college: e.target.value})} className="admin-input" />
                </div>
                
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Add Modal */}
        {addingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="admin-card w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-indigo-500/20 my-auto"
            >
              <h2 className="text-xl font-bold text-white mb-6">Add New Student</h2>
              <form onSubmit={handleAddStudent} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
                    <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="admin-input" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email *</label>
                    <input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="admin-input" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password *</label>
                    <input type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="admin-input" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">College</label>
                    <input type="text" value={addForm.college} onChange={e => setAddForm({...addForm, college: e.target.value})} className="admin-input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                    <select value={addForm.department} onChange={e => setAddForm({...addForm, department: e.target.value})} className="admin-input">
                      <option value="">Select Dept</option>
                      {['AI&DS','CSE','AIML','IT','EEE','BME','CIVIL','MECH'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Section</label>
                    <select value={addForm.section} onChange={e => setAddForm({...addForm, section: e.target.value})} className="admin-input">
                      <option value="">Select Sec</option>
                      {['A','B','C'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                    <input type="text" value={addForm.year} onChange={e => setAddForm({...addForm, year: e.target.value})} className="admin-input" placeholder="e.g. 3" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Skills Offered (comma separated)</label>
                    <input type="text" value={addForm.skillsOffered} onChange={e => setAddForm({...addForm, skillsOffered: e.target.value})} className="admin-input" placeholder="e.g. React, Node, Python" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Completed Courses (comma separated)</label>
                    <input type="text" value={addForm.completedCourses} onChange={e => setAddForm({...addForm, completedCourses: e.target.value})} className="admin-input" placeholder="e.g. Advanced AI, UI/UX" />
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end mt-8 pt-6 border-t border-white/5">
                  <button type="button" onClick={() => setAddingStudent(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    Create Student Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </AdminLayout>
  )
}
