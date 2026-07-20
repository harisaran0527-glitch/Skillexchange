import { useState, useEffect } from 'react'
import { adminCoursesApi, Course } from '../services/adminApi'

const CATEGORIES = ['General', 'Programming', 'Web Development', 'Data Science', 'Design', 'AI & ML', 'Cybersecurity', 'Cloud', 'Soft Skills', 'Database', 'Mobile']
const PRESET_COURSES = [
  { name: 'Python', category: 'Programming', icon: '🐍' },
  { name: 'Java', category: 'Programming', icon: '☕' },
  { name: 'C Programming', category: 'Programming', icon: '⚙️' },
  { name: 'C++', category: 'Programming', icon: '🔧' },
  { name: 'JavaScript', category: 'Web Development', icon: '🟡' },
  { name: 'React', category: 'Web Development', icon: '⚛️' },
  { name: 'Node.js', category: 'Web Development', icon: '🟢' },
  { name: 'MongoDB', category: 'Database', icon: '🍃' },
  { name: 'SQL', category: 'Database', icon: '🗄️' },
  { name: 'Machine Learning', category: 'AI & ML', icon: '🤖' },
  { name: 'Artificial Intelligence', category: 'AI & ML', icon: '🧠' },
  { name: 'Data Science', category: 'Data Science', icon: '📊' },
  { name: 'Power BI', category: 'Data Science', icon: '📈' },
  { name: 'Excel', category: 'General', icon: '📋' },
  { name: 'UI/UX Design', category: 'Design', icon: '🎨' },
  { name: 'Figma', category: 'Design', icon: '🎯' },
  { name: 'Cyber Security', category: 'Cybersecurity', icon: '🔒' },
  { name: 'Cloud Computing', category: 'Cloud', icon: '☁️' },
  { name: 'Communication Skills', category: 'Soft Skills', icon: '🗣️' },
]

const empty = { name: '', description: '', category: 'General', icon: '' }

export default function AdminCourses() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('All')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const load = async () => {
    try { setCourses(await adminCoursesApi.getAll()) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = courses.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = selectedCat === 'All' || c.category === selectedCat
    return matchSearch && matchCat
  })

  const openAdd = () => { setEditCourse(null); setForm(empty); setShowModal(true) }
  const openEdit = (c: Course) => { setEditCourse(c); setForm({ name: c.name, description: c.description, category: c.category, icon: c.icon }); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditCourse(null); setForm(empty) }

  const handlePreset = (p: typeof PRESET_COURSES[0]) => { setForm(f => ({ ...f, name: p.name, category: p.category, icon: p.icon })) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editCourse) { await adminCoursesApi.update(editCourse.id, form) }
      else { await adminCoursesApi.create(form) }
      await load(); closeModal()
    } catch (e: any) { alert(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await adminCoursesApi.delete(id); setCourses(c => c.filter(x => x.id !== id)) }
    catch (e: any) { alert(e.message) }
    finally { setDeleteConfirm(null) }
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Course Directory</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>{courses.length} courses in the master database</p>
        </div>
        <button onClick={openAdd} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 24px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ➕ Add Course
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          placeholder="🔍 Search courses..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '14px', outline: 'none' }}
        />
        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
          style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: '14px', outline: 'none' }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ height: '140px', borderRadius: '12px', background: 'linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#ef4444', background: '#1e293b', borderRadius: '12px', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '32px' }}>⚠️</div>
          <p>{error}</p>
          <p style={{ fontSize: '13px', color: '#64748b' }}>Database not connected. Connect PostgreSQL to manage courses.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', background: '#1e293b', borderRadius: '12px', border: '1px dashed #334155' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>No courses found. Add your first course!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px' }}>
          {filtered.map(course => (
            <div key={course.id} style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: '1px solid #334155', borderRadius: '14px', padding: '20px', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(99,102,241,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <span style={{ fontSize: '32px' }}>{course.icon || '📘'}</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '15px' }}>{course.name}</div>
                    <span style={{ display: 'inline-block', background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', marginTop: '4px' }}>{course.category}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEdit(course)} style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                  <button onClick={() => setDeleteConfirm(course.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                </div>
              </div>
              {course.description && <p style={{ color: '#64748b', fontSize: '13px', marginTop: '12px', marginBottom: 0, lineHeight: 1.5 }}>{course.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: '20px' }}>{editCourse ? 'Edit Course' : 'Add Course'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>

            {/* Quick Presets */}
            {!editCourse && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Quick Add Presets</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {PRESET_COURSES.map(p => (
                    <button key={p.name} onClick={() => handlePreset(p)}
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
                      {p.icon} {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields */}
            {[
              { label: 'Course Name *', key: 'name', placeholder: 'e.g. Python' },
              { label: 'Icon (Emoji)', key: 'icon', placeholder: 'e.g. 🐍' },
              { label: 'Description', key: 'description', placeholder: 'Short description...' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '16px' }}>
                <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            <div style={{ marginBottom: '24px' }}>
              <label style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '6px' }}>Category</label>
              <select value={form.category} onChange={e => setForm(x => ({ ...x, category: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: '14px', outline: 'none' }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Saving...' : editCourse ? 'Update Course' : 'Add Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#1e293b', border: '1px solid #ef4444', borderRadius: '16px', padding: '32px', width: '400px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗑️</div>
            <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Delete Course?</h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
