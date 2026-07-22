const mongoose = require('mongoose')

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI

  if (!uri) {
    console.error('[DB] Critical error: MongoDB connection URI is not configured! Please set MONGODB_URI or MONGO_URI environment variable.')
    process.exit(1)
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
