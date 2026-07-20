import React, { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import DataTable from '../components/DataTable'
import { adminSkillsApi, SkillStat } from '../services/adminApi'
import { Edit2, Trash2, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminSkills() {
  const [data, setData] = useState<SkillStat[]>([])
  const [filteredData, setFilteredData] = useState<SkillStat[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
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

  async function handleDelete(name: string) {
    if (!confirm(`Are you sure you want to delete the skill "${name}" from ALL users? This action cannot be undone.`)) return
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

  const columns = [
    {
      key: 'name', label: 'Skill Name',
      render: (s: SkillStat) => <span className="font-semibold text-slate-200">{s.name}</span>
    },
    {
      key: 'offered', label: 'Offered By',
      render: (s: SkillStat) => <span className="text-indigo-400 font-medium">{s.offered} students</span>
    },
    {
      key: 'needed', label: 'Needed By',
      render: (s: SkillStat) => <span className="text-cyan-400 font-medium">{s.needed} students</span>
    },
    {
      key: 'total', label: 'Total Usage',
      render: (s: SkillStat) => <span className="text-emerald-400 font-medium">{s.total}</span>
    },
    {
      key: 'actions', label: 'Actions',
      render: (s: SkillStat) => (
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditingSkill(s.name); setNewName(s.name) }} 
            className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors" title="Edit/Rename">
            <Edit2 size={14} />
          </button>
          <button onClick={() => handleDelete(s.name)} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Delete Everywhere">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <AdminLayout title="Skill Management">
      <div className="admin-card p-4 rounded-2xl mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" placeholder="Search skills..." 
            value={search} onChange={e => setSearch(e.target.value)}
            className="admin-input pl-9 w-full"
          />
        </div>
      </div>

      <div className="admin-card rounded-2xl p-1 pb-2">
        <DataTable columns={columns} data={filteredData} loading={loading} />
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="admin-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-indigo-500/20"
            >
              <h2 className="text-lg font-bold text-white mb-4">Rename Skill</h2>
              <p className="text-xs text-slate-400 mb-4">This will update the skill "{editingSkill}" for all students who offer or need it.</p>
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
