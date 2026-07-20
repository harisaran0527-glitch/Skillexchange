const mongoose = require('mongoose')

const emailLogSchema = new mongoose.Schema({
  toEmail: { type: String, required: true },
  toName: { type: String },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  status: { type: String, required: true }
}, { timestamps: true })

module.exports = mongoose.model('EmailLog', emailLogSchema)
