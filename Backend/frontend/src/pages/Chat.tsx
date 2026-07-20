import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../layouts/main/MainLayout'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { usersApi } from '../services/api'
import { Send, Smile, Paperclip, Image as ImageIcon, ArrowLeft, Check, CheckCheck } from 'lucide-react'

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, onlineUsers } = useSocket()
  
  const [partner, setPartner] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [partnerTyping, setPartnerTyping] = useState(false)
  const [chatLocked, setChatLocked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const isOnline = id && onlineUsers.has(id)

  useEffect(() => {
    if (id) {
      // Fetch partner details
      usersApi.getUserById(id).then(setPartner).catch(() => navigate(-1))
      
      // Check if chat is unlocked (only if there's an Accepted request)
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => {
        if (res.status === 403) setChatLocked(true);
        else return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) setMessages(data)
      })
      .catch(console.error)
    }
  }, [id, navigate])

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (msg) => {
        if (msg.senderId === id || msg.receiverId === id) {
          setMessages(prev => [...prev, msg])
          if (msg.senderId === id) {
            socket.emit('mark_seen', { messageId: msg._id, senderId: id })
          }
        }
      })

      socket.on('typing', ({ senderId }) => {
        if (senderId === id) setPartnerTyping(true)
      })

      socket.on('stop_typing', ({ senderId }) => {
        if (senderId === id) setPartnerTyping(false)
      })

      socket.on('message_seen', ({ messageId }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, read: true } : m))
      })
    }
    
    return () => {
      if (socket) {
        socket.off('new_message')
        socket.off('typing')
        socket.off('stop_typing')
        socket.off('message_seen')
      }
    }
  }, [socket, id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, partnerTyping])

  let typingTimeout: any
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    
    if (!isTyping && socket && id) {
      setIsTyping(true)
      socket.emit('typing', { receiverId: id })
    }
    
    clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      if (socket && id) {
        setIsTyping(false)
        socket.emit('stop_typing', { receiverId: id })
      }
    }, 1500)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !id || !socket) return

    const newMessage = {
      _id: Math.random().toString(), // Temp ID until server responds
      senderId: user?.id,
      receiverId: id,
      message: input,
      createdAt: new Date().toISOString(),
      read: false
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    
    // API call to send message
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ receiverId: id, message: input })
    }).catch(err => console.error(err))
    
    socket.emit('stop_typing', { receiverId: id })
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 relative flex items-center justify-center font-bold text-indigo-400">
                {partner?.name?.charAt(0) || 'U'}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </div>
              <div>
                <h3 className="font-bold text-white">{partner?.name || 'Loading...'}</h3>
                <p className="text-xs text-slate-400">{isOnline ? 'Active Now' : 'Offline'}</p>
              </div>
            </div>
          </div>
        </div>

        {chatLocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Chat Locked</h3>
            <p className="text-slate-400 max-w-md">You can only chat with students after your learning request has been accepted.</p>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {messages.map((m, idx) => {
                const isMe = m.senderId === user?.id
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                      <p className="text-sm">{m.message}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (m.read ? <CheckCheck size={12} className="text-indigo-200" /> : <Check size={12} className="opacity-70" />)}
                      </div>
                    </div>
                  </div>
                )
              })}
              {partnerTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex gap-1 items-center">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-900">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors"><Smile size={20} /></button>
                  <button type="button" className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors"><Paperclip size={20} /></button>
                  <button type="button" className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-full transition-colors"><ImageIcon size={20} /></button>
                </div>
                
                <input 
                  type="text" 
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition-colors text-sm"
                />
                
                <button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </div>
          </>
        )}
        
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
      `}</style>
    </MainLayout>
  )
}
