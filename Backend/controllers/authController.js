const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const { createNotification } = require('./notificationController')

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, department, section, year, college, profileImage } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) return res.status(400).json({ message: 'Email already in use' })

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      department: department || '',
      section: section || '',
      year: year || '',
      college: college || '',
      profileImage: profileImage || ''
    })
    
    await user.save()

    const token = signToken(user._id)

    // Notify admins of new registration
    await createNotification({
      senderId: user._id.toString(),
      receiverId: 'admin', // This could be mapped to an admin system in the future
      message: `New student registration: ${user.name} (${user.email})`,
      notificationType: 'System Notification'
    }, req.io)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        section: user.section,
        year: user.year,
        college: user.college,
        profileImage: user.profileImage
      }
    })
  } catch (err) {
    next(err)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' })

    if (user.isSuspended) return res.status(403).json({ message: 'Your account has been suspended.' })

    const token = signToken(user._id)

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (err) {
    next(err)
  }
}

exports.logout = async (req, res) => {
  res.json({ message: 'Logout: remove token on client' })
}
