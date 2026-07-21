const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
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

// load env early
dotenv.config()

const path = require('path')
const fs = require('fs')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

// CORS configuration
const rawOrigins = process.env.CORS_ORIGIN || ''
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()) : []

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: process.env.CORS_CREDENTIALS === 'true'
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))

// Socket.io setup
const io = new Server(server, {
  cors: corsOptions
})

// Attach io to req object
app.use((req, res, next) => {
  req.io = io
  next()
})

// Socket Connection Handling
require('./socket')(io)

// Serve frontend static build if present (optional)
const possibleFrontendPaths = [
  path.join(__dirname, 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join(__dirname, 'frontend', 'build'),
  path.join(__dirname, '..', 'frontend', 'build')
]
for (const p of possibleFrontendPaths) {
  if (fs.existsSync(p)) {
    console.log('Serving frontend static from', p)
    app.use(express.static(p))
    app.get('*', (req, res, next) => {
      const reqPath = req.path
      if (reqPath.startsWith('/api/')) return next()
      res.sendFile(path.join(p, 'index.html'))
    })
    break
  }
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/skills', skillRoutes)
app.use('/api/match', matchRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin/auth', adminAuthRoutes)              // public admin auth
app.use('/api/admin', adminProtect, adminRoutes)         // all admin routes require admin token

// Simple root route for quick verification (if frontend not served above)
app.get('/', (req, res) => {
  res.send('SkillSwap Backend is running')
})

// Health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// Readiness endpoint
app.get('/api/readiness', (req, res) => {
  res.json({ readyState: 1 })
})

// Error handling
app.use(notFound)
app.use(errorHandler)

// Start server async
async function startServer() {
  const { connectDB } = require('./config/db')
  const { connectMongoDB } = require('./config/mongoDb')
  
  await connectDB()
  await connectMongoDB()

  const PORT = process.env.PORT || 5000
  const HOST = process.env.HOST || '0.0.0.0'

  server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`)
    console.log(`NODE_ENV=${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()
