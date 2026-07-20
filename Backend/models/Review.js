const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  reviewerId: { type: String, required: true },
  revieweeId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Review', reviewSchema)
