import React, { useState, useEffect } from 'react'
import MainLayout from '../layouts/main/MainLayout'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { notificationApi, requestApi } from '../services/api'
import { Check, X, Bell, Clock } from 'lucide-react'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [receivedRequests, setReceivedRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [notifRes, receivedRes, sentRes] = await Promise.all([
        notificationApi.get(),
        requestApi.getReceived(),
        requestApi.getSent()
      ])
      setNotifications(notifRes.notifications || [])
      setReceivedRequests(receivedRes || [])
      setSentRequests(sentRes || [])
      await notificationApi.markAllRead()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept(id: string) {
    try {
      await requestApi.accept(id)
      setReceivedRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r))
    } catch (err: any) { alert(err.message) }
  }

  async function handleReject(id: string) {
    try {
      await requestApi.reject(id)
      setReceivedRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r))
    } catch (err: any) { alert(err.message) }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white">Teaching Requests & Alerts</h1>
              <p className="text-slate-400 text-sm">Manage teaching requests, responses, and real-time notifications</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-900/60 rounded-3xl border border-blue-500/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-10">
              
              {/* Teaching Requests Received (To Teach Others) */}
              <div>
                <h2 className="text-sm font-extrabold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Check size={16} />
                  <span>Incoming Teaching Requests ({receivedRequests.length})</span>
                </h2>

                {receivedRequests.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                    <p className="text-sm text-slate-400">No incoming teaching requests at the moment.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {receivedRequests.map(req => {
                        const status = (req.status || 'PENDING').toUpperCase()
                        return (
                          <motion.div
                            key={req.id}
                            initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}
                            className="p-6 rounded-3xl bg-slate-900/60 border border-blue-500/20 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-blue-500/40 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white text-lg flex-shrink-0 shadow-md">
                                {req.fromUser?.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <p className="text-white text-base">
                                  <span className="font-extrabold text-blue-300">{req.fromUser?.name || req.studentName}</span> requested your help to learn <span className="font-extrabold text-purple-300">{req.courseName || req.skill}</span>
                                </p>
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                                  <span>{req.fromUser?.department || req.department || 'AVS Student'} {req.fromUser?.year ? `• Year ${req.fromUser.year}` : ''}</span>
                                  <span>• {req.requestDate || new Date(req.createdAt).toLocaleDateString()}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              {status === 'PENDING' ? (
                                <>
                                  <button 
                                    onClick={() => handleReject(req.id)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5"
                                  >
                                    <X size={15} /> Reject
                                  </button>
                                  <button 
                                    onClick={() => handleAccept(req.id)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5 active:scale-95"
                                  >
                                    <Check size={16} /> Accept
                                  </button>
                                </>
                              ) : (
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-extrabold tracking-wider uppercase border ${
                                  status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                  {status}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* My Sent Teaching Requests */}
              <div>
                <h2 className="text-sm font-extrabold text-purple-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock size={16} />
                  <span>My Sent Teaching Requests ({sentRequests.length})</span>
                </h2>

                {sentRequests.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                    <p className="text-sm text-slate-400">You haven't sent any teaching requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.map(req => {
                      const status = (req.status || 'PENDING').toUpperCase()
                      return (
                        <div
                          key={req.id}
                          className="p-5 rounded-3xl bg-slate-900/60 border border-white/10 shadow-lg backdrop-blur-xl flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center font-bold text-slate-300">
                              {req.toUser?.name?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {req.courseName || req.skill} <span className="text-slate-400 font-normal">→</span> <span className="text-blue-300">{req.toUser?.name || req.tutorName}</span>
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{req.requestDate || new Date(req.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          <span className={`px-3 py-1 rounded-xl text-xs font-extrabold tracking-wider uppercase border ${
                            status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* General Activity Notifications */}
              <div>
                <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h2>
                {notifications.length === 0 ? (
                  <div className="text-center py-10 bg-slate-900/40 rounded-3xl border border-slate-800">
                    <p className="text-sm text-slate-400">No general notifications.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((n, i) => (
                      <motion.div
                        key={n.id || n._id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={`p-4 rounded-2xl flex justify-between items-center transition-all border ${n.read ? 'bg-slate-900/40 border-white/5' : 'bg-slate-900/80 border-blue-500/30'}`}
                      >
                        <div className="flex gap-3.5 items-center">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
                            <Bell size={18} />
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.message || n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{n.createdDate} {n.createdTime}</p>
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
