const dotenv = require('dotenv')
const http = require('http')
const { Server } = require('socket.io')

dotenv.config()

const app = require('./app')
const server = http.createServer(app)

const rawOrigins = process.env.CORS_ORIGIN || ''
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()).filter(Boolean) : []
const vercelPattern = /\.vercel\.app$/

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin) || vercelPattern.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS: ' + origin))
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, { cors: corsOptions })

app.use((req, res, next) => {
  req.io = io
  next()
})

require('./socket')(io)

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  const { connectDB } = require('./config/db')
  const { connectMongoDB } = require('./config/mongoDb')

  await connectDB()
  connectMongoDB().catch(err => console.error('[DB Initial Load Error]', err.message || err))

  const PORT = parseInt(process.env.PORT || '5005', 10)
  const HOST = process.env.HOST || '0.0.0.0'

  console.log(`[Diagnostic] PID: ${process.pid}`)
  console.log(`[Diagnostic] Attempting to listen on ${HOST}:${PORT} ...`)

  process.on('uncaughtException', (err) => {
    console.error('[Diagnostic] Uncaught Exception:', err.stack || err)
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Diagnostic] Unhandled Rejection at:', promise, 'reason:', reason)
  })

  server.on('error', (err) => {
    console.error('[Diagnostic] Server error:', err.stack || err)
  })

  server.on('listening', () => {
    console.log('[Diagnostic] Server listening event fired.')
    const addr = server.address()
    console.log(`[Diagnostic] Server is listening at:`, addr)
  })

  server.on('close', () => {
    console.log('[Diagnostic] Server closed.')
  })

  server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`)
    console.log(`NODE_ENV=${process.env.NODE_ENV || 'development'}`)
  })
}

startServer().catch(err => {
  console.error('[Diagnostic] startServer failed:', err.stack || err)
})
