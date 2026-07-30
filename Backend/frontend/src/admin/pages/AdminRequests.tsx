import React, { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import DataTable from '../components/DataTable'
import { adminRequestsApi, LearningRequest } from '../services/adminApi'
import { Check, X, Trash2, Filter } from 'lucide-react'

export default function AdminRequests() {
  const [data, setData] = useState<{ requests: LearningRequest[]; total: number; page: number; pages: number }>({ requests: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { loadRequests() }, [status, page])

  async function loadRequests() {
    setLoading(true)
    try {
      const resp = await adminRequestsApi.getAll({ status, page, limit: 10 })
      setData(resp)
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject' | 'delete') {
    let confirmMsg = ''
    if (action === 'delete') confirmMsg = 'Are you sure you want to delete this request permanently?'
    if (confirmMsg && !confirm(confirmMsg)) return

    if (action === 'approve') await adminRequestsApi.approve(id)
    else if (action === 'reject') await adminRequestsApi.reject(id)
    else await adminRequestsApi.delete(id)
    
    loadRequests()
  }

  const columns = [
    {
      key: 'fromUser', label: 'From Student',
      render: (r: LearningRequest) => (
        <div>
          <p className="font-medium text-slate-200">{r.fromUser?.name || 'Deleted User'}</p>
          <p className="text-xs text-slate-500">{r.fromUser?.department || ''}</p>
        </div>
      )
    },
    {
      key: 'toUser', label: 'To Student',
      render: (r: LearningRequest) => (
        <div>
          <p className="font-medium text-slate-200">{r.toUser?.name || 'Deleted User'}</p>
          <p className="text-xs text-slate-500">{r.toUser?.department || ''}</p>
        </div>
      )
    },
    {
      key: 'skill', label: 'Requested Skill/Course',
      render: (r: LearningRequest) => (
        <div>
          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-xs font-semibold">{r.skill}</span>
          {(r as any).courseName && (r as any).courseName !== r.skill && (
            <p className="text-[10px] text-slate-500 mt-1">Course: {(r as any).courseName}</p>
          )}
        </div>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (r: LearningRequest) => {
        const s = (r.status || 'PENDING').toUpperCase()
        const colors: any = { PENDING: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', APPROVED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', REJECTED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' }
        return <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${colors[s] || colors.PENDING}`}>{s}</span>
      }
    },
    {
      key: 'createdAt', label: 'Created Date',
      render: (r: LearningRequest) => <span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</span>
    },
    {
      key: 'actions', label: 'Actions',
      render: (r: LearningRequest) => (
        <div className="flex items-center gap-2">
          {((r.status || '').toUpperCase() === 'PENDING') && (
            <>
              <button onClick={() => handleAction(r._id, 'approve')} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors" title="Approve">
                <Check size={14} />
              </button>
              <button onClick={() => handleAction(r._id, 'reject')} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Reject">
                <X size={14} />
              </button>
            </>
          )}
          <button onClick={() => handleAction(r._id, 'delete')} className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ]

  return (
    <AdminLayout title="Teaching Requests System">
      <div className="admin-card p-4 rounded-2xl mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} className="admin-input py-2 bg-[#181b2e] text-slate-200 border border-white/10 rounded-xl">
            <option value="" className="bg-[#181b2e] text-slate-200">All Request Statuses</option>
            <option value="PENDING" className="bg-[#181b2e] text-slate-200">PENDING</option>
            <option value="APPROVED" className="bg-[#181b2e] text-slate-200">APPROVED</option>
            <option value="REJECTED" className="bg-[#181b2e] text-slate-200">REJECTED</option>
          </select>
        </div>
      </div>

      <div className="admin-card rounded-2xl p-1 pb-2">
        <DataTable
          columns={columns}
          data={data.requests}
          loading={loading}
          page={data.page}
          pages={data.pages}
          total={data.total}
          onPageChange={setPage}
        />
      </div>
    </AdminLayout>
  )
}
