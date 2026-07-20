const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  fileUrl: { type: String },
  fileType: { type: String }, // 'image', 'document', etc.
  read: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)
