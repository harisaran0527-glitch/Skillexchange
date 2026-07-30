import React, { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { adminSkillsApi, SkillStat, SkillStudent } from '../services/adminApi'
import { Edit2, Trash2, Search, BookOpen, Users, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminSkills() {
  const [data, setData] = useState<SkillStat[]>([])
  const [filteredData, setFilteredData] = useState<SkillStat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  
  const [addingSkill, setAddingSkill] = useState(false)
  const [newSkillName, setNewSkillName] = useState('')

  const [editingSkill, setEditingSkill] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  useEffect(() => { loadSkills() }, [])

  useEffect(() => {
    if (!search) setFilteredData(data)
    else setFilteredData(data.filter(s => s.name.toLowerCase().includes(search.toLowerCase())))
  }, [search, data])

  async function loadSkills() {
    setLoading(true)
    try {
      const resp = await adminSkillsApi.getAll()
      setData(resp)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault()
    if (!newSkillName.trim()) return
    try {
      await adminSkillsApi.create(newSkillName.trim())
      setAddingSkill(false)
      setNewSkillName('')
      loadSkills()
    } catch (err: any) {
      alert(err.message || 'Failed to add skill')
    }
  }

  async function handleDelete(name: string) {
    if (!confirm(`Are you sure you want to delete the skill "${name}"? This will also remove it from all students.`)) return
    await adminSkillsApi.delete(name)
    loadSkills()
  }
  
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSkill || !newName || editingSkill === newName) return
    await adminSkillsApi.rename(editingSkill, newName)
    setEditingSkill(null)
    setNewName('')
    loadSkills()
  }

  return (
    <AdminLayout title="Skills & Courses Directory">
      {/* Top Search & Actions */}
      <div className="admin-card p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="admin-search-wrapper flex-1 max-w-md">
          <Search size={16} className="admin-search-icon" />
          <input 
            type="text" placeholder="Search skills or courses..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="admin-input admin-search-input w-full"
          />
        </div>
        <button 
          onClick={() => setAddingSkill(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Add Skill / Course
        </button>
      </div>

      {/* Directory List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl admin-skeleton" />)}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="admin-card rounded-2xl p-12 text-center">
          <BookOpen size={36} className="mx-auto text-slate-600 mb-3" />
          <p className="text-slate-300 font-semibold text-base">No Skills Found</p>
          <p className="text-slate-500 text-sm mt-1">Add skills through Admin or when adding students.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredData.map(skill => {
            const isExpanded = expandedSkill === skill.name
            const studentsList: SkillStudent[] = skill.students || []

            return (
              <div key={skill.name} className="admin-card rounded-2xl overflow-hidden transition-all border border-white/5">
                <div 
                  onClick={() => setExpandedSkill(isExpanded ? null : skill.name)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-base">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-200">{skill.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Users size={13} className="text-indigo-400" />
                        <span>{studentsList.length} {studentsList.length === 1 ? 'Student' : 'Students'} Connected</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => { setEditingSkill(skill.name); setNewName(skill.name) }}
                      className="p-2 rounded-xl bg-white/5 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                      title="Rename Skill"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button 
                      onClick={() => handleDelete(skill.name)}
                      className="p-2 rounded-xl bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                      title="Delete Skill"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => setExpandedSkill(isExpanded ? null : skill.name)}
                      className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Students List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-white/5 bg-slate-900/40 p-5"
                    >
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>Students associated with {skill.name}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                          {studentsList.length}
                        </span>
                      </h4>

                      {studentsList.length === 0 ? (
                        <p className="text-xs text-slate-500 italic py-2">No students currently linked to this skill.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {studentsList.map(st => (
                            <div 
                              key={st._id}
                              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between hover:border-indigo-500/30 transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-300 font-bold text-xs flex items-center justify-center">
                                  {st.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-200">{st.name}</p>
                                  <p className="text-[11px] text-slate-500">{st.department || 'Student'}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                st.isSuspended ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                              }`}>
                                {st.isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Skill Modal */}
      <AnimatePresence>
        {addingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="admin-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-indigo-500/20"
            >
              <h2 className="text-lg font-bold text-white mb-4">Add Skill / Course</h2>
              <form onSubmit={handleAddSkill}>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Skill Name</label>
                  <input 
                    type="text" value={newSkillName} onChange={e => setNewSkillName(e.target.value)} 
                    className="admin-input w-full" placeholder="e.g. C++, Java, Python" required autoFocus 
                  />
                </div>
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setAddingSkill(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    Add Skill
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Skill Modal */}
        {editingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="admin-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-indigo-500/20"
            >
              <h2 className="text-lg font-bold text-white mb-4">Rename Skill</h2>
              <p className="text-xs text-slate-400 mb-4">This will update "{editingSkill}" across all linked students.</p>
              <form onSubmit={handleSaveEdit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Skill Name</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="admin-input w-full" required autoFocus />
                </div>
                <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setEditingSkill(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    Rename Skill
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

