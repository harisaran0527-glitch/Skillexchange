import React, { useState, useEffect } from 'react'
import MainLayout from '../layouts/main/MainLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { notificationApi, requestApi } from '../services/api'
import { Check, X, Bell } from 'lucide-react'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [notifRes, reqRes] = await Promise.all([
        notificationApi.get(),
        requestApi.getReceived()
      ])
      setNotifications(notifRes.notifications)
      setRequests(reqRes.filter((r: any) => r.status?.toLowerCase() === 'pending'))
      await notificationApi.markAllRead() // Mark all as read when opening page
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(id: string) {
    try {
      await requestApi.accept(id)
      setRequests(reqs => reqs.filter(r => r.id !== id))
    } catch (err: any) { alert(err.message) }
  }

  async function handleReject(id: string) {
    try {
      await requestApi.reject(id)
      setRequests(reqs => reqs.filter(r => r.id !== id))
    } catch (err: any) { alert(err.message) }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-slate-500">Your latest alerts and learning requests</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {/* Active Session Requests */}
              {requests.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Pending Requests</h2>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {requests.map(req => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                          className="p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-300 flex-shrink-0">
                              {req.fromUser.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-slate-200">
                                <span className="font-semibold text-white">{req.fromUser.name}</span> wants to learn <span className="font-semibold text-indigo-400">{req.skill}</span>
                              </p>
                              <p className="text-sm text-slate-400 mt-1">
                                {req.fromUser.department} • Year {req.fromUser.year}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleReject(req.id)}
                              className="p-2.5 rounded-xl bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 transition-colors flex items-center justify-center"
                            >
                              <X size={18} />
                            </button>
                            <button 
                              onClick={() => handleAccept(req.id)}
                              className="px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                            >
                              <Check size={18} /> Accept
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* General Notifications */}
              <div>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h2>
                {notifications.length === 0 && requests.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800/50">
                    <span className="text-4xl">📭</span>
                    <p className="mt-4 text-slate-400">No new notifications</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n, i) => (
                      <motion.div
                        key={n.id || n._id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl flex justify-between items-center transition-all ${n.read ? 'bg-slate-900/30' : 'bg-slate-800/60 border-l-2 border-indigo-500'}`}
                      >
                        <div className="flex gap-4">
                          <div className="text-xl mt-0.5">
                            {n.notificationType === 'Learning Request' ? '🔔' : n.notificationType === 'Accepted' ? '✅' : n.notificationType === 'Rejected' ? '❌' : 'ℹ️'}
                          </div>
                          <div>
                            <p className={`font-medium ${n.read ? 'text-slate-400' : 'text-slate-200'}`}>{n.message || n.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{n.createdDate} {n.createdTime}</p>
                            
                            {n.notificationType === 'Accepted' && n.senderId && (
                              <Link to={`/chat/${n.senderId}`} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold rounded-lg transition-colors">
                                Chat with Student
                              </Link>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </MainLayout>
  )
}
