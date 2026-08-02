const mongoose = require('mongoose')

const learningRequestSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  tutorId: { type: String, required: true },
  studentName: { type: String, required: true },
  tutorName: { type: String, required: true },
  courseName: { type: String, required: true },
  department: { type: String },
  section: { type: String },
  status: { type: String, default: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED', 'Pending', 'Accepted', 'Approved', 'Rejected'] },
  requestDate: { type: String },
  requestTime: { type: String },
  message: { type: String },
  actionTokenHash: { type: String, default: null },
  actionTokenExpiry: { type: Date, default: null },
  tokenUsed: { type: Boolean, default: false }
}, { timestamps: true })

module.exports = mongoose.model('LearningRequest', learningRequestSchema)
