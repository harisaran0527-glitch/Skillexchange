import React, { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { adminReportsApi } from '../services/adminApi'
import { Download, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<'monthly' | 'students' | 'skills' | 'departments'>('monthly')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadReport() }, [activeTab])

  async function loadReport() {
    setLoading(true)
    try {
      const resp = await adminReportsApi.get(activeTab)
      setData(resp)
    } finally {
      setLoading(false)
    }
  }

  function handleExportCSV() {
    if (!data) return
    let csv = ''
    if (activeTab === 'monthly') {
      csv = 'Month,Registrations\n'
      data.monthly.forEach((r: any) => csv += `${r.month},${r.registrations}\n`)
    } else if (activeTab === 'students') {
      csv = 'Name,Email,Department,Year,College,Status\n'
      data.students.forEach((s: any) => csv += `"${s.name}","${s.email}","${s.department}","${s.year}","${s.college}","${s.isSuspended?'Suspended':'Active'}"\n`)
    } else if (activeTab === 'skills') {
      csv = 'Skill,Offered,Needed,Total\n'
      data.skills.forEach((s: any) => csv += `"${s.name}",${s.offered},${s.needed},${s.total}\n`)
    } else if (activeTab === 'departments') {
      csv = 'Department,Student Count\n'
      data.departments.forEach((d: any) => csv += `"${d.name}",${d.count}\n`)
    }
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `skillswap_${activeTab}_report.csv`
    a.click()
  }

  function handlePrintPDF() {
    window.print() // Uses browser print functionality to save as PDF
  }

  const TABS = [
    { id: 'monthly', label: 'Monthly Growth' },
    { id: 'students', label: 'Student Roster' },
    { id: 'skills', label: 'Skill Analytics' },
    { id: 'departments', label: 'Department Stats' }
  ]

  return (
    <AdminLayout title="Reports & Analytics">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 pb-px hide-on-print">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-semibold relative transition-colors ${
              activeTab === tab.id ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-6 hide-on-print">
        <h2 className="text-lg font-bold text-slate-200 capitalize">{activeTab} Report</h2>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} disabled={loading || !data} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
            <Download size={16} /> Export Excel (CSV)
          </button>
          <button onClick={handlePrintPDF} disabled={loading || !data} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-500/20 transition-colors disabled:opacity-50">
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="admin-card rounded-2xl p-6 print-friendly">
        {loading ? (
          <div className="space-y-4">
            {[1,2,3,4].map(i => <div key={i} className="h-12 admin-skeleton rounded-xl" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'monthly' && data?.monthly && (
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-white/5 text-slate-400"><th className="pb-3">Month</th><th className="pb-3 text-right">New Registrations</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.monthly.map((row: any) => (
                    <tr key={row.month}><td className="py-3 text-slate-200 font-medium">{row.month}</td><td className="py-3 text-right text-indigo-400 font-semibold">{row.registrations}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'students' && data?.students && (
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-white/5 text-slate-400"><th className="pb-3">Name</th><th className="pb-3">Email</th><th className="pb-3">Dept</th><th className="pb-3">Status</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.students.map((s: any) => (
                    <tr key={s._id}><td className="py-3 text-slate-200 font-medium">{s.name}</td><td className="py-3 text-slate-400">{s.email}</td><td className="py-3 text-slate-400">{s.department || '—'}</td><td className="py-3">{s.isSuspended ? <span className="text-rose-400">Suspended</span> : <span className="text-emerald-400">Active</span>}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'skills' && data?.skills && (
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-white/5 text-slate-400"><th className="pb-3">Skill</th><th className="pb-3">Offered</th><th className="pb-3">Needed</th><th className="pb-3 text-right">Total Usage</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.skills.map((s: any) => (
                    <tr key={s.name}><td className="py-3 text-slate-200 font-medium">{s.name}</td><td className="py-3 text-slate-400">{s.offered}</td><td className="py-3 text-slate-400">{s.needed}</td><td className="py-3 text-right text-indigo-400 font-semibold">{s.total}</td></tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'departments' && data?.departments && (
              <table className="w-full text-sm text-left">
                <thead><tr className="border-b border-white/5 text-slate-400"><th className="pb-3">Department</th><th className="pb-3 text-right">Total Students</th></tr></thead>
                <tbody className="divide-y divide-white/5">
                  {data.departments.map((d: any) => (
                    <tr key={d.name}><td className="py-3 text-slate-200 font-medium">{d.name}</td><td className="py-3 text-right text-indigo-400 font-semibold">{d.count}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .hide-on-print { display: none !important; }
          .admin-sidebar { display: none !important; }
          .admin-card { background: transparent !important; border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border-bottom: 1px solid #ddd !important; padding: 12px 8px !important; color: black !important; }
          th { font-weight: bold !important; color: #333 !important; }
        }
      `}</style>
    </AdminLayout>
  )
}
