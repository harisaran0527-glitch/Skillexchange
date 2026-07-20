const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  college: { type: String, default: '' },
  department: { type: String, default: '' },
  section: { type: String, default: '' },
  year: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  skillsOffered: { type: [String], default: [] },
  completedCourses: { type: [String], default: [] },
  certificates: { type: [String], default: [] },
  availability: { type: String, default: 'available', enum: ['available', 'busy', 'offline'] },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  portfolioLinks: { type: [String], default: [] },
  socialLinks: { type: [String], default: [] }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
