const mongoose = require('mongoose')
const dns = require('dns')

// Prefer IPv4 for DNS resolution
try {
  dns.setDefaultResultOrder('ipv4first')
} catch (_) {}

let cachedPromise = null
let dbError = null

const getDbError = () => dbError

const connectMongoDB = async () => {
  // 1. If connection is already established, reuse it immediately
  if (mongoose.connection.readyState === 1) {
    dbError = null
    return mongoose.connection
  }

  // 2. If a connection attempt is in progress, await the existing promise
  if (cachedPromise) {
    try {
      await cachedPromise
      if (mongoose.connection.readyState === 1) {
        dbError = null
        return mongoose.connection
      }
    } catch (err) {
      cachedPromise = null
    }
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI

  // Check if missing or set to default placeholder
  if (!uri || uri.trim() === '' || uri === 'your_mongodb_atlas_connection_string') {
    const errMsg = 'MongoDB connection URI is not configured! Please configure MONGODB_URI or MONGO_URI.'
    console.error(`[DB] CRITICAL ERROR: ${errMsg}`)
    dbError = new Error(errMsg)
    throw dbError
  }

  // Reject localhost/loopback addresses in production
  if (uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('::1')) {
    const errMsg = 'Localhost / loopback database addresses are forbidden! Use a remote MongoDB Atlas database cluster.'
    console.error(`[DB] CRITICAL ERROR: ${errMsg}`)
    dbError = new Error(errMsg)
    throw dbError
  }

  // Validate scheme
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    const errMsg = 'Invalid connection string scheme! Scheme must be mongodb:// or mongodb+srv://'
    console.error(`[DB] CRITICAL ERROR: ${errMsg}`)
    dbError = new Error(errMsg)
    throw dbError
  }

  // DNS fallback for SRV records if system DNS fails
  if (uri.startsWith('mongodb+srv://')) {
    try {
      const hostPart = uri.split('@')[1]?.split('/')[0]?.split('?')[0]
      if (hostPart) {
        await new Promise((resolve, reject) => {
          dns.resolveSrv('_mongodb._tcp.' + hostPart, (err, addrs) => {
            if (err) reject(err)
            else resolve(addrs)
          })
        })
      }
    } catch (srvErr) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1'])
      } catch (_) {}
    }
  }

  // Disable command buffering so Mongoose fails fast if disconnected instead of buffering for 10000ms
  mongoose.set('bufferCommands', false)

  console.log('[DB] Connecting to MongoDB Atlas...')

  cachedPromise = mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000, // 5 seconds timeout
    maxPoolSize: 10,
    minPoolSize: 1,
    bufferCommands: false
  }).then((m) => {
    console.log('[DB] Connected to MongoDB Atlas database successfully')
    dbError = null
    return m
  }).catch((error) => {
    console.error(`[DB] MongoDB connection failure: ${error.message}`)
    dbError = error
    cachedPromise = null
    throw error
  })

  return await cachedPromise
}

module.exports = { connectMongoDB, getDbError }
