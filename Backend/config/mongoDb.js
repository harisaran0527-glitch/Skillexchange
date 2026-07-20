const mongoose = require('mongoose')

const connectMongoDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap'
    await mongoose.connect(uri)
    console.log('[DB] Connected to MongoDB via Mongoose')
  } catch (error) {
    console.error(`[DB] MongoDB connection error: ${error.message}`)
    console.warn('[DB] Server will continue running, but MongoDB calls will fail.')
  }
}

module.exports = { connectMongoDB }
