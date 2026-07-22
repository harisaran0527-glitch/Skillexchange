const mongoose = require('mongoose')

let dbError = null

const getDbError = () => dbError

const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI

  // Check if missing or set to placeholder
  if (!uri || uri.trim() === '' || uri === 'your_mongodb_atlas_connection_string') {
    const errMsg = 'MongoDB connection URI is not configured! Please configure MONGODB_URI or MONGO_URI.'
    console.error('\n========================================================================')
    console.error(`[DB] CRITICAL ERROR: ${errMsg}`)
    console.error('[DB] Missing environment variable: MONGODB_URI (or MONGO_URI)')
    console.error('[DB] Please add your MongoDB Atlas connection string to your local .env file')
    console.error('[DB] or Render Environment settings.')
    console.error('========================================================================\n')
    dbError = new Error(errMsg)
    return
  }

  // Reject localhost/loopback addresses
  if (uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('::1')) {
    const errMsg = 'Localhost / loopback database addresses are forbidden! Use a remote MongoDB Atlas database cluster.'
    console.error('\n========================================================================')
    console.error(`[DB] CRITICAL ERROR: ${errMsg}`)
    console.error('[DB] Your connection string contains localhost, 127.0.0.1, or ::1.')
    console.error('[DB] Please update MONGODB_URI to use a remote MongoDB Atlas database cluster.')
    console.error('========================================================================\n')
    dbError = new Error(errMsg)
    return
  }

  // Validate scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    const errMsg = 'Invalid connection string scheme! Scheme must be mongodb:// or mongodb+srv://'
    console.error('\n========================================================================')
    console.error(`[DB] CRITICAL ERROR: ${errMsg}`)
    console.error(`[DB] Provided URI: "${uri}"`)
    console.error('[DB] Connection URI must start with "mongodb://" or "mongodb+srv://".')
    console.error('========================================================================\n')
    dbError = new Error(errMsg)
    return
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // 5 seconds connection timeout
    })
    console.log('[DB] Connected to MongoDB Atlas database successfully')
    dbError = null
  } catch (error) {
    console.error('\n========================================================================')
    console.error(`[DB] MongoDB connection failure: ${error.message}`)
    dbError = error
    
    // Identify authentication failures
    if (error.message.includes('Authentication failed') || error.message.includes('auth failed') || error.code === 8000) {
      console.error('[DB] REASON: Authentication failed. The database user password in your connection string is likely incorrect.')
      console.error('[DB] ACTION: Please reset your database user password in MongoDB Atlas and update the URI.')
    } 
    // Identify missing user / bad configuration
    else if (error.message.includes('user not found') || error.message.includes('not authorized')) {
      console.error('[DB] REASON: Database user is not authorized or does not exist.')
      console.error('[DB] ACTION: Create a database user in MongoDB Atlas with "Read and write to any database" privileges.')
    }
    console.error('========================================================================\n')
  }
}

module.exports = { connectMongoDB, getDbError }
