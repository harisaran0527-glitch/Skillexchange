const mongoose = require('mongoose')

const certificateSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  courseName: { type: String, required: true, trim: true },
  issuedBy: { type: String, default: 'SkillSwap Platform' },
  issueDate: { type: String, default: '' },
  credentialUrl: { type: String, default: '' },
  verified: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('Certificate', certificateSchema)
