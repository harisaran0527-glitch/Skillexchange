const mongoose = require('mongoose')

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'General' },
  icon: { type: String, default: '' },
  officialWebsite: { type: String, default: '' },
  learningResources: { type: String, default: '' },
  youtubeUrl: { type: String, default: '' },
  questionBankUrl: { type: String, default: '' },
  questionBankTitle: { type: String, default: '' },
  questionBankContent: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

module.exports = mongoose.model('Course', courseSchema)

