import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, Trash2, BookOpen, MessageSquare } from 'lucide-react'
import { notificationApi } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { formatDistanceToNow } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'

export default function NotificationBell() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  useEffect(() => {
    if (socket) {
      socket.on('new_notification', (data) => {
        setNotifications(prev => [data, ...prev])
        setUnreadCount(prev => prev + 1)
      })
    }
    return () => {
      if (socket) socket.off('new_notification')
    }
  }, [socket])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  async function loadNotifications() {
    try {
      const res = await notificationApi.get()
      setNotifications(res.notifications || [])
      setUnreadCount(res.unreadCount || 0)
    } catch (err) {}
  }

  async function markAsRead(id: string) {
    try {
      await notificationApi.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, status: 'Read' } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {}
  }

  async function markAllAsRead() {
    try {
      await notificationApi.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true, status: 'Read' })))
      setUnreadCount(0)
    } catch (err) {}
  }

  async function deleteNotification(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await notificationApi.delete(id)
      const target = notifications.find(n => n.id === id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (target && !target.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {}
  }

  function handleNotificationClick(n: any) {
    if (!n.read) markAsRead(n.id)
    setIsOpen(false)
    if (n.notificationType === 'Message') {
      navigate(`/chat/${n.senderId}`)
    } else {
      navigate('/notifications')
    }
  }

  function getRelativeTime(dateStr: string, timeStr: string, createdAt: string) {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch (err) {
      return dateStr
    }
  }

  function getIcon(type: string) {
    switch (type) {
      case 'Message': return <MessageSquare size={16} className="text-blue-400" />
      case 'Learning Request': return <BookOpen size={16} className="text-indigo-400" />
      case 'Accepted': return <Check size={16} className="text-emerald-400" />
      default: return <Bell size={16} className="text-slate-400" />
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                  <Bell size={32} className="opacity-20 mb-3" />
                  <p className="text-sm">You have no notifications.</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div 
                    key={n.id || n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors relative group ${!n.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}
                  >
                    {!n.read && <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-500 rounded-full" />}
                    
                    <div className="flex gap-3 pl-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 relative">
                        {n.senderImage ? (
                          <img src={n.senderImage} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {n.senderName ? n.senderName.charAt(0) : 'S'}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                          {getIcon(n.notificationType)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                          {n.message}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {getRelativeTime(n.createdDate, n.createdTime, n.createdAt)}
                        </p>
                      </div>

                      <button 
                        onClick={(e) => deleteNotification(n.id || n._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all self-start"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900">
              <Link 
                to="/notifications" 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View All Notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
