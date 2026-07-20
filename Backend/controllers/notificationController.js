const Notification = require('../models/Notification')
const User = require('../models/User')

// GET /api/notifications - get current user's notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ receiverId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      
    // Optionally fetch sender details
    const enriched = await Promise.all(notifications.map(async (n) => {
      const sender = await User.findById(n.senderId).select('name profileImage')
      return { ...n.toObject(), id: n._id.toString(), senderName: sender?.name, senderImage: sender?.profileImage }
    }))

    const unreadCount = enriched.filter(n => !n.read).length
    res.json({ notifications: enriched, unreadCount })
  } catch (err) { next(err) }
}

// PUT /api/notifications/:id/read - mark as read
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: 'Read', read: true })
    res.json({ message: 'Notification marked as read' })
  } catch (err) { next(err) }
}

// PUT /api/notifications/read-all - mark all as read
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ receiverId: req.user.id, read: false }, { status: 'Read', read: true })
    res.json({ message: 'All notifications marked as read' })
  } catch (err) { next(err) }
}

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ message: 'Notification deleted' })
  } catch (err) { next(err) }
}

// Helper to create a notification (used by other controllers)
exports.createNotification = async (data, io) => {
  try {
    const now = new Date()
    const notification = new Notification({
      ...data,
      createdDate: now.toLocaleDateString(),
      createdTime: now.toLocaleTimeString()
    })
    await notification.save()

    // Real-time emit
    if (io) {
      const { getConnectedUsers } = require('../socket')
      const users = getConnectedUsers()
      const socketId = users.get(data.receiverId)
      if (socketId) {
        io.to(socketId).emit('new_notification', notification)
      }
    }
  } catch (err) {
    console.error('Failed to create notification:', err.message)
  }
}
