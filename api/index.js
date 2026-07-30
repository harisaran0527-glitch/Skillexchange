const app = require('../Backend/app')
const { connectMongoDB } = require('../Backend/config/mongoDb')

module.exports = async (req, res) => {
  try {
    await connectMongoDB()
  } catch (err) {
    console.error('[Vercel Serverless] MongoDB connection failed:', err.message || err)
    res.setHeader('Content-Type', 'application/json')
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please verify MONGODB_URI configuration and MongoDB Atlas Network Access rules.'
    })
  }
  return app(req, res)
}
