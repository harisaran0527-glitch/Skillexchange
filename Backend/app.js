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
const renderPattern = /\.onrender\.com$/

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (curl, Postman, server-to-server)
    if (!origin) return callback(null, true)
    // If no explicit allowed list, allow all (open in development)
    if (allowedOrigins.length === 0) return callback(null, true)
    // Allow listed origins or any Vercel/Render preview/production URL
    if (allowedOrigins.includes(origin) || vercelPattern.test(origin) || renderPattern.test(origin)) {
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
app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose')
  const Admin = require('./models/Admin')
  const ensureAdminExists = require('./config/initAdmin')

  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || ''
  const trimmed = rawUri.trim().replace(/^["']|["']$/g, '').trim()
  const uriScheme = trimmed.startsWith('mongodb+srv://')
    ? 'mongodb+srv://'
    : trimmed.startsWith('mongodb://')
    ? 'mongodb://'
    : (trimmed ? 'invalid_scheme' : 'missing')

  let adminCount = -1
  let adminCollectionName = Admin.collection ? Admin.collection.name : 'unknown'
  let initResult = null

  if (mongoose.connection.readyState === 1) {
    try {
      initResult = await ensureAdminExists()
      adminCount = await Admin.countDocuments()
    } catch (err) {
      initResult = { success: false, error: err.message || String(err) }
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    commit: 'e28f910',
    dbConnected: mongoose.connection.readyState === 1,
    currentDatabaseName: mongoose.connection.db ? mongoose.connection.db.databaseName : 'unknown',
    hasMongodbUri: Boolean(rawUri),
    uriScheme,
    envVars: {
      SEED_ADMIN_EMAIL: Boolean(process.env.SEED_ADMIN_EMAIL),
      SEED_ADMIN_PASSWORD: Boolean(process.env.SEED_ADMIN_PASSWORD)
    },
    adminDiagnostics: {
      adminCollectionName,
      adminCount,
      initResult
    }
  })
})
app.get('/api/readiness', (req, res) => res.json({ readyState: 1 }))

// Cluster & Database Inspector
app.get('/api/inspect-db', async (req, res) => {
  const mongoose = require('mongoose')
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Database connection not established' })
  }

  try {
    const adminDb = mongoose.connection.db.admin()
    const dbsResult = await adminDb.listDatabases()

    const report = []

    for (const dbInfo of dbsResult.databases) {
      const dbName = dbInfo.name
      if (['admin', 'local', 'config'].includes(dbName)) continue

      const dbReport = {
        name: dbName,
        sizeOnDisk: dbInfo.sizeOnDisk,
        collections: []
      }

      const currentDb = mongoose.connection.useDb(dbName, { useCache: false })
      const collections = await currentDb.db.listCollections().toArray()

      for (const col of collections) {
        const colName = col.name
        const count = await currentDb.db.collection(colName).countDocuments()
        let sampleKeys = []
        let sampleDoc = null

        if (count > 0) {
          const sample = await currentDb.db.collection(colName).find().limit(1).toArray()
          if (sample[0]) {
            sampleDoc = { ...sample[0] }
            delete sampleDoc.password
            sampleKeys = Object.keys(sampleDoc)
          }
        }

        dbReport.collections.push({
          name: colName,
          count,
          sampleKeys,
          sampleDoc
        })
      }

      report.push(dbReport)
    }

    res.json({
      currentDatabaseName: mongoose.connection.db.databaseName,
      databases: report
    })
  } catch (err) {
    console.error('[DB Inspector Error]', err)
    res.status(500).json({ error: err.message || String(err) })
  }
})

// Email Diagnostic & SMTP Verification Endpoint
app.get('/api/email-status', async (req, res) => {
  const nodemailer = require('nodemailer')
  const EmailLog = require('./models/EmailLog')

  const emailUser = (process.env.EMAIL_USER || '').trim()
  const emailPass = (process.env.EMAIL_PASS || '').trim()

  const hasUser = Boolean(emailUser)
  const hasPass = Boolean(emailPass)

  const obfuscatedUser = hasUser
    ? `${emailUser.substring(0, 3)}***@${emailUser.split('@')[1] || 'gmail.com'}`
    : 'MISSING'

  let smtpVerified = false
  let smtpError = null

  if (hasUser && hasPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: emailUser,
          pass: emailPass.replace(/\s+/g, '')
        },
        tls: { rejectUnauthorized: false }
      })
      await transporter.verify()
      smtpVerified = true
    } catch (err) {
      smtpVerified = false
      smtpError = err.message || String(err)
    }
  } else {
    smtpError = 'EMAIL_USER or EMAIL_PASS environment variable is missing.'
  }

  let recentLogs = []
  try {
    recentLogs = await EmailLog.find().sort({ createdAt: -1 }).limit(10).select('-body')
  } catch (_) {}

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    envVars: {
      EMAIL_USER: hasUser ? 'YES' : 'NO',
      EMAIL_PASS: hasPass ? 'YES' : 'NO',
      obfuscatedUser
    },
    smtpStatus: {
      connected: smtpVerified,
      error: smtpError
    },
    recentEmailLogsCount: recentLogs.length,
    recentEmailLogs: recentLogs
  })
})

// Real Production Test Email Trigger Endpoint
app.post('/api/test-send-email', async (req, res) => {
  const { sendEmail } = require('./controllers/emailController')
  const targetEmail = req.body?.email || req.query?.email || process.env.EMAIL_USER

  if (!targetEmail) {
    return res.status(400).json({ error: 'Please provide recipient email in request body: { "email": "recipient@domain.com" }' })
  }

  console.log(`[Test Email Endpoint] Initiating test email send to: ${targetEmail}`)

  const result = await sendEmail({
    to: targetEmail,
    toName: 'SkillExchange User',
    subject: 'SkillExchange Production SMTP Test Notification',
    html: `
      <div style="font-family:sans-serif;padding:24px;background:#0b0f19;color:#fff;border-radius:12px">
        <h2 style="color:#60a5fa;margin-top:0">⚡ SkillExchange Live SMTP Diagnostic Test</h2>
        <p>This is a real test email sent directly from your live production Render server.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p style="color:#10b981;font-weight:bold">✅ Gmail SMTP connection & authentication verified successfully!</p>
      </div>
    `
  })

  res.json({
    targetEmail,
    result
  })
})

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
