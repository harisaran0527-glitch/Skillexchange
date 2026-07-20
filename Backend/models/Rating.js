const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model('Rating', ratingSchema)
