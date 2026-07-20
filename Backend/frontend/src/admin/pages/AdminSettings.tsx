import React, { useState, useEffect } from 'react'
import AdminLayout from '../layouts/AdminLayout'
import { adminAuthApi } from '../services/adminApi'
import { useAdminAuth } from '../context/AdminAuthContext'
import { Shield, Key, CheckCircle, AlertCircle } from 'lucide-react'

export default function AdminSettings() {
  const { admin } = useAdminAuth()
  
  const [name, setName] = useState('')
  const [nameMsg, setNameMsg] = useState({ text: '', type: '' })
  
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [pwdMsg, setPwdMsg] = useState({ text: '', type: '' })

  useEffect(() => {
    if (admin) setName(admin.name)
  }, [admin])

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setNameMsg({ text: '', type: '' })
    try {
      await adminAuthApi.updateProfile(name)
      setNameMsg({ text: 'Profile updated successfully. Refresh to see changes globally.', type: 'success' })
    } catch (err: any) {
      setNameMsg({ text: err.message || 'Update failed', type: 'error' })
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdMsg({ text: '', type: '' })
    if (newPwd.length < 6) return setPwdMsg({ text: 'New password must be at least 6 characters', type: 'error' })
    try {
      await adminAuthApi.changePassword(oldPwd, newPwd)
      setPwdMsg({ text: 'Password changed successfully', type: 'success' })
      setOldPwd(''); setNewPwd('')
    } catch (err: any) {
      setPwdMsg({ text: err.message || 'Password change failed', type: 'error' })
    }
  }

  function AlertMsg({ msg }: { msg: { text: string; type: string } }) {
    if (!msg.text) return null
    const isErr = msg.type === 'error'
    return (
      <div className={`flex items-center gap-2 mb-4 px-4 py-3 rounded-xl text-sm ${isErr ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
        {isErr ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
        {msg.text}
      </div>
    )
  }

  return (
    <AdminLayout title="Admin Settings">
      <div className="max-w-3xl space-y-6">
        
        {/* Profile Settings */}
        <div className="admin-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Administrator Profile</h2>
              <p className="text-xs text-slate-500">Update your account details</p>
            </div>
          </div>
          
          <AlertMsg msg={nameMsg} />

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address (Read-only)</label>
              <input type="email" value={admin?.email || ''} readOnly className="admin-input opacity-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="admin-input" required />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
              Save Profile
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="admin-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Security Settings</h2>
              <p className="text-xs text-slate-500">Change your administrative password</p>
            </div>
          </div>

          <AlertMsg msg={pwdMsg} />

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Password</label>
              <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} className="admin-input" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">New Password</label>
              <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="admin-input" required />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-rose-500/20">
              Change Password
            </button>
          </form>
        </div>

      </div>
    </AdminLayout>
  )
}
