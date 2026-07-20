const mongoose = require('mongoose')

const learningRequestSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  tutorId: { type: String, required: true },
  studentName: { type: String, required: true },
  tutorName: { type: String, required: true },
  courseName: { type: String, required: true },
  department: { type: String },
  section: { type: String },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Accepted', 'Rejected'] },
  requestDate: { type: String },
  requestTime: { type: String },
  message: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('LearningRequest', learningRequestSchema)
