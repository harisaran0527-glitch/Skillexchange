const app = require('../Backend/app')
const { connectMongoDB } = require('../Backend/config/mongoDb')

module.exports = async (req, res) => {
  try {
    await connectMongoDB()
  } catch (err) {
    console.error('[Vercel Serverless] MongoDB connection error:', err)
  }
  return app(req, res)
}
