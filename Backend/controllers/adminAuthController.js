const Admin = require('../models/Admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { getDbError } = require('../config/mongoDb')

if (!process.env.ADMIN_JWT_SECRET) {
  throw new Error('FATAL: ADMIN_JWT_SECRET environment variable is missing!')
}
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET

const signAdminToken = (admin) => {
  return jwt.sign(
    { id: admin.id || admin._id, email: admin.email, name: admin.name, isAdmin: true },
    ADMIN_JWT_SECRET,
    { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1d' }
  )
}

// POST /api/admin/auth/login
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body
    
    console.log(`[Admin Login Attempt] Email: ${email || '(none)'}`)

    if (!email || !password) {
      console.warn('[Admin Login Attempt] Failed: Email or password not provided')
      return res.status(400).json({ message: 'Email and password required' })
    }

    const inputEmail = email.toLowerCase().trim()

    // Fallback to database lookup - check database connection error first
    const dbErr = getDbError()
    if (dbErr) {
      console.error(`[Admin Login Attempt] Failed: Database connection error: ${dbErr.message}`)
      return res.status(500).json({
        message: `Database Connection Failed: ${dbErr.message}. Ensure your MongoDB Atlas credentials and IP access list are configured correctly on Render.`
      })
    }

    console.log('[Admin Login Attempt] Performing database lookup for admin account')
    const admin = await Admin.findOne({ email: inputEmail })
    if (!admin) {
      console.warn(`[Admin Login Attempt] Failed: No admin user found for email: ${inputEmail}`)
      return res.status(401).json({ message: 'Invalid credentials: Admin account does not exist' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      console.warn(`[Admin Login Attempt] Failed: Incorrect password for email: ${inputEmail}`)
      return res.status(401).json({ message: 'Invalid credentials: Password is incorrect' })
    }

    console.log(`[Admin Login Attempt] Success: DB admin logged in (${inputEmail})`)
    const token = signAdminToken(admin)
    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (err) {
    console.error('[Admin Login Attempt] Error occurred:', err.message)
    next(err)
  }
}

// GET /api/admin/auth/me
exports.adminMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password')
    if (!admin) return res.status(404).json({ message: 'Admin not found' })
    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      createdAt: admin.createdAt
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new password required' })
    }

    const admin = await Admin.findById(req.admin.id)
    if (!admin) return res.status(404).json({ message: 'Admin not found' })

    const isMatch = await bcrypt.compare(oldPassword, admin.password)
    if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' })

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(newPassword, salt)

    admin.password = hashed
    await admin.save()

    res.json({ message: 'Password changed successfully' })
  } catch (err) {
    next(err)
  }
}

// PUT /api/admin/auth/update-profile
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const { name } = req.body

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      { name },
      { new: true, select: '-password' }
    )

    res.json({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      createdAt: admin.createdAt
    })
  } catch (err) {
    next(err)
  }
}
