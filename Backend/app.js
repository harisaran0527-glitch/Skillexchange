const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// Load environment variables (support root cwd as well as Backend cwd)
dotenv.config()
dotenv.config({ path: path.join(__dirname, '.env') })

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
const rawOrigins = process.env.CORS_ORIGIN || ''
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()).filter(Boolean) : []
const vercelPattern = /\.vercel\.app$/

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server)
    if (!origin) return callback(null, true)
    // If no explicit allowed list, allow all (open in development)
    if (allowedOrigins.length === 0) return callback(null, true)
    // Allow listed origins or any Vercel preview/production URL
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
app.options('*', cors(corsOptions))
app.use(express.json({ limit: '10mb' }))

// Health & readiness
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose')
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || ''
  const trimmed = rawUri.trim().replace(/^["']|["']$/g, '').trim()
  const uriScheme = trimmed.startsWith('mongodb+srv://')
    ? 'mongodb+srv://'
    : trimmed.startsWith('mongodb://')
    ? 'mongodb://'
    : (trimmed ? 'invalid_scheme' : 'missing')

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
    hasMongodbUri: Boolean(rawUri),
    uriScheme
  })
})
app.get('/api/readiness', (req, res) => res.json({ readyState: 1 }))

// DB Connection Middleware for all API endpoints
app.use('/api', async (req, res, next) => {
  try {
    const { connectMongoDB } = require('./config/mongoDb')
    await connectMongoDB()
    next()
  } catch (err) {
    console.error('[API Middleware] DB Connection Error:', err.message || err)
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please verify MONGODB_URI configuration and database access.'
    })
  }
})

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/match', matchRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin', adminProtect, adminRoutes)

// Health & readiness
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))
app.get('/api/readiness', (req, res) => res.json({ readyState: 1 }))

// ─── Frontend Static Build (SPA fallback for standalone deployment) ─────────
const possibleFrontendPaths = [
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join(__dirname, '..', 'dist'),
  path.join(__dirname, 'frontend', 'build'),
  path.join(__dirname, '..', 'frontend', 'build')
]

let frontendServed = false
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(p)) {
    console.log('Serving frontend static from', p)
    app.use(express.static(p))
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next()
      res.sendFile(path.join(p, 'index.html'))
    })
    frontendServed = true
    break
  }
}

if (!frontendServed) {
  app.get('/', (req, res) => res.send('SkillSwap Backend is running'))
}

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

module.exports = app
