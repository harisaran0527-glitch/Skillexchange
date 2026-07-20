const jwt = require('jsonwebtoken')

// Keep track of connected users: { userId: socketId }
const connectedUsers = new Map()

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token
    if (!token) {
      return next(new Error('Authentication error'))
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.user = decoded
      next()
    } catch (err) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.user.id
    connectedUsers.set(userId, socket.id)
    
    // Broadcast user online status
    io.emit('user_status', { userId, status: 'online' })

    socket.on('disconnect', () => {
      connectedUsers.delete(userId)
      io.emit('user_status', { userId, status: 'offline' })
    })

    socket.on('typing', ({ receiverId }) => {
      const receiverSocketId = connectedUsers.get(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', { senderId: userId })
      }
    })

    socket.on('stop_typing', ({ receiverId }) => {
      const receiverSocketId = connectedUsers.get(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('stop_typing', { senderId: userId })
      }
    })
    
    socket.on('mark_seen', ({ messageId, senderId }) => {
      const senderSocketId = connectedUsers.get(senderId)
      if (senderSocketId) {
        io.to(senderSocketId).emit('message_seen', { messageId })
      }
    })
  })
}

// Utility to get connected users if needed by controllers
module.exports.getConnectedUsers = () => connectedUsers
