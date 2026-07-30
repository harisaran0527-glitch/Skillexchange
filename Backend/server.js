const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')
const http = require('http')
const { Server } = require('socket.io')

// Load environment variables first
dotenv.config()

const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const skillRoutes = require('./routes/skills')
const matchRoutes = require('./routes/match')
const courseRoutes = require('./routes/courses')
const notificationRoutes = require('./routes/notifications')
const searchRoutes = require('./routes/search')
const requestRoutes = require('./routes/requests')
const chatRoutes = require('./routes/chat')
const adminRoutes = require('./routes/admin')
const adminAuthRoutes = require('./routes/adminAuth')
const { adminProtect } = require('./middleware/adminMiddleware')
const { errorHandler, notFound } = require('./middleware/errorHandler')

const app = express()
const server = http.createServer(app)

// ─── Request Logging Middleware ───────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[REQUEST] ${req.method} ${req.url} - Status: ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// ─── CORS Configuration ───────────────────────────────────────────────────────
// Allow origins from CORS_ORIGIN env var, plus all *.vercel.app preview URLs
const rawOrigins = process.env.CORS_ORIGIN || ''
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()).filter(Boolean) : []
const vercelPattern = /\.vercel\.app$/

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server)
    if (!origin) return callback(null, true)
    // If no explicit allowed list, allow all (open in development)
    if (allowedOrigins.length === 0) return callback(null, true)
    // Allow listed origins or any Vercel preview URL
    if (allowedOrigins.includes(origin) || vercelPattern.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS: ' + origin))
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions))
// Handle preflight OPTIONS for all routes
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '10mb' }))

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, { cors: corsOptions })

app.use((req, res, next) => {
  req.io = io
  next()
})

require('./socket')(io)

// ─── API Routes (registered BEFORE static file serving) ──────────────────────
// CRITICAL: These must come before the wildcard static file handler to prevent
// POST /api/admin/auth/login from returning 405 Method Not Allowed.
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/match', matchRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin/auth', adminAuthRoutes)        // Public — no auth middleware
app.use('/api/admin', adminProtect, adminRoutes)   // Protected — requires admin JWT

// Health & readiness
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))
app.get('/api/readiness', (req, res) => res.json({ readyState: 1 }))

// ─── Frontend Static Build (SPA fallback) ─────────────────────────────────────
// Registered AFTER all API routes so the wildcard never intercepts API requests.
const possibleFrontendPaths = [
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join(__dirname, 'frontend', 'build'),
  path.join(__dirname, '..', 'frontend', 'build')
]

let frontendServed = false
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(p)) {
    console.log('Serving frontend static from', p)
    app.use(express.static(p))
    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next()
      res.sendFile(path.join(p, 'index.html'))
    })
    frontendServed = true
    break
  }
}

if (!frontendServed) {
  app.get('/', (req, res) => res.send('SkillSwap Backend is running (no frontend build found)'))
}

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer() {
  const { connectDB } = require('./config/db')
  const { connectMongoDB } = require('./config/mongoDb')

  await connectDB()
  await connectMongoDB()

  const PORT = parseInt(process.env.PORT || '5005', 10)
  const HOST = process.env.HOST || '127.0.0.1'

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

  console.log('[Diagnostic] typeof PORT:', typeof PORT, 'PORT:', PORT, 'HOST:', HOST)
  console.log('[Diagnostic] Before server.listen()')
  server.listen(PORT, HOST, () => {
    console.log('[Diagnostic] After server.listen() callback')
    console.log(`Server running on ${HOST}:${PORT}`)
    console.log(`NODE_ENV=${process.env.NODE_ENV || 'development'}`)
    console.log(`CORS origins: ${allowedOrigins.length ? allowedOrigins.join(', ') : 'all (open)'}`)
  })
}

startServer().catch(err => {
  console.error('[Diagnostic] startServer failed:', err.stack || err)
})
