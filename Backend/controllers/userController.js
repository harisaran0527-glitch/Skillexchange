const User = require('../models/User')

// Get authenticated user's profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// Get any user's public profile by ID
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// Update authenticated user's profile
exports.updateProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body }
    delete updates.password
    delete updates.email
    delete updates.id
    delete updates._id

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, select: '-password' }
    )
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// Search students: by name, department, skill
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, department, section, year, availability } = req.query
    const where = {}

    if (q) {
      where.$or = [
        { name: { $regex: q, $options: 'i' } },
        { completedCourses: q }
      ]
    }
    if (department) where.department = department
    if (section) where.section = section
    if (year) where.year = year
    if (availability) where.availability = availability

    const users = await User.find(where).select('-password')
    res.json(users)
  } catch (err) {
    next(err)
  }
}

// Add a skill to authenticated user's profile
exports.addSkillToProfile = async (req, res, next) => {
  try {
    const { type, skill } = req.body
    if (!type || !skill) return res.status(400).json({ message: 'type and skill are required' })
    if (type !== 'offered') return res.status(400).json({ message: 'type must be "offered"' })

    const updateField = 'skillsOffered'

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const list = user[updateField]
    if (list.includes(skill)) {
      return res.status(400).json({ message: 'Skill already present in profile' })
    }

    user[updateField].push(skill)
    await user.save()

    const updated = user.toObject()
    delete updated.password
    res.json({ message: 'Skill added', user: updated })
  } catch (err) {
    next(err)
  }
}

// Remove a skill from authenticated user's profile
exports.removeSkillFromProfile = async (req, res, next) => {
  try {
    const { type, skill } = req.body
    if (!type || !skill) return res.status(400).json({ message: 'type and skill are required' })
    if (type !== 'offered') return res.status(400).json({ message: 'type must be "offered"' })

    const updateField = 'skillsOffered'

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    user[updateField] = user[updateField].filter(s => s !== skill)
    await user.save()

    const updated = user.toObject()
    delete updated.password
    res.json({ message: 'Skill removed', user: updated })
  } catch (err) {
    next(err)
  }
}
