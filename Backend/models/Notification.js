const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  requestId: { type: String },
  courseName: { type: String },
  message: { type: String, required: true },
  notificationType: { type: String, default: 'System', enum: ['Learning Request', 'Accepted', 'Rejected', 'Message', 'Course Update', 'System Notification'] },
  status: { type: String, default: 'Unread', enum: ['Read', 'Unread'] },
  read: { type: Boolean, default: false },
  createdDate: { type: String },
  createdTime: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
