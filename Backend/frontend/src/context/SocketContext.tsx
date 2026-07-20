import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  onlineUsers: Set<string>
}

const SocketContext = createContext<SocketContextType>({ socket: null, onlineUsers: new Set() })

export const useSocket = () => useContext(SocketContext)

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (token && user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: { token }
      })

      newSocket.on('connect', () => {
        console.log('Socket connected')
      })

      newSocket.on('user_status', ({ userId, status }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev)
          if (status === 'online') updated.add(userId)
          else updated.delete(userId)
          return updated
        })
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    } else {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
    }
  }, [token, user])

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  )
}
