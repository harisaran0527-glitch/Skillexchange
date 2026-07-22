const Admin = require('../models/Admin')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Use a consistent fallback so sign and verify always use the same secret
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'skillswap_ADMIN_ultra_secret_2024'

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
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const inputEmail = email.toLowerCase().trim()

    // ── Hardcoded Admin Check ────────────────────────────────────────
    if (inputEmail === 'skillexchange@gmail.com' && password === 'saran@2007') {
      const admin = { id: 'static-admin-id', name: 'SkillSwap Admin', email: 'skillexchange@gmail.com', role: 'superadmin' }
      const token = signAdminToken(admin)
      return res.json({
        token,
        admin
      })
    }

    // Also support default admin requirement from instruction
    if (inputEmail === 'admin@skillswap.com' && password === 'Admin@123') {
      const admin = { id: 'static-admin-id-2', name: 'SkillSwap Admin', email: 'admin@skillswap.com', role: 'superadmin' }
      const token = signAdminToken(admin)
      return res.json({
        token,
        admin
      })
    }

    // Fallback to database lookup
    const admin = await Admin.findOne({ email: inputEmail })
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' })
    }

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
    next(err)
  }
}

// GET /api/admin/auth/me
exports.adminMe = async (req, res, next) => {
  try {
    if (req.admin.id === 'static-admin-id' || req.admin.id === 'static-admin-id-2') {
      return res.json({
        id: req.admin.id,
        name: 'SkillSwap Admin',
        email: req.admin.email,
        role: 'superadmin',
        avatar: '',
        createdAt: new Date()
      })
    }

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

    if (req.admin.id === 'static-admin-id' || req.admin.id === 'static-admin-id-2') {
      return res.json({ message: 'Static admin password cannot be changed programmatically.' })
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

    if (req.admin.id === 'static-admin-id' || req.admin.id === 'static-admin-id-2') {
      return res.json({
        id: req.admin.id,
        name: name,
        email: req.admin.email,
        role: 'superadmin',
        avatar: '',
        createdAt: new Date()
      })
    }

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
