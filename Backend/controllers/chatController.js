const Message = require('../models/Message')

// GET /api/chat/:userId - Get conversation between current user and :userId
exports.getConversation = async (req, res, next) => {
  try {
    const { userId } = req.params
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: userId },
        { senderId: userId, receiverId: req.user.id }
      ]
    }).sort({ createdAt: 1 })

    res.json(messages)
  } catch (err) { next(err) }
}

// POST /api/chat - Send a message
exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message, fileUrl, fileType } = req.body
    if (!receiverId || !message) return res.status(400).json({ message: 'receiverId and message are required' })

    // Only allow chat if there's an accepted request
    const LearningRequest = require('../models/LearningRequest');
    const request = await LearningRequest.findOne({ status: 'Accepted', $or: [{ studentId: req.user.id, tutorId: receiverId }, { studentId: receiverId, tutorId: req.user.id }] })
    if (!request) return res.status(403).json({ message: 'Chat is only available for accepted sessions.' })

    const newMessage = new Message({
      senderId: req.user.id,
      receiverId,
      message,
      fileUrl: fileUrl || '',
      fileType: fileType || ''
    })

    await newMessage.save()

    // Real-time emit
    if (req.io) {
      const { getConnectedUsers } = require('../socket')
      const User = require('../models/User')
      const senderUser = await User.findById(req.user.id).select('name')
      const users = getConnectedUsers()
      const socketId = users.get(receiverId)
      if (socketId) {
        req.io.to(socketId).emit('new_message', newMessage)
        
        // Also emit a notification
        req.io.to(socketId).emit('new_notification', {
          notificationType: 'Message',
          message: `New message from ${senderUser?.name || 'someone'}`,
          createdTime: new Date().toLocaleTimeString()
        })
      }
    }

    res.status(201).json(newMessage)
  } catch (err) { next(err) }
}
