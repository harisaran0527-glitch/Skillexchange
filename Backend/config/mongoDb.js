const mongoose = require('mongoose')

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[DB] Critical error: MongoDB URI is not set in production. Please configure MONGODB_URI.')
      process.exit(1)
    }
    // Development fallback
    const fallbackUri = 'mongodb://127.0.0.1:27017/skillswap'
    console.warn(`[DB] No MongoDB URI specified. Falling back to local development DB: ${fallbackUri}`)
    try {
      await mongoose.connect(fallbackUri)
      console.log('[DB] Connected to local MongoDB')
    } catch (error) {
      console.error(`[DB] Local MongoDB connection error: ${error.message}`)
      process.exit(1)
    }
    return
  }

  try {
    await mongoose.connect(uri)
    console.log('[DB] Connected to MongoDB database successfully')
  } catch (error) {
    console.error(`[DB] MongoDB connection failure: ${error.message}`)
    process.exit(1)
  }
}

module.exports = { connectMongoDB }
