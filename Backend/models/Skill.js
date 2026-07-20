const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
  },
  { timestamps: true }
)

module.exports = mongoose.model('Skill', skillSchema)
