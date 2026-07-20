const Skill = require('../models/Skill')

// Create a new skill
exports.createSkill = async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'Skill name is required' })

    // Avoid duplicates (case-insensitive)
    const existing = await Skill.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    })
    
    if (existing) return res.status(400).json({ message: 'Skill already exists' })

    const skill = new Skill({
      name: name.trim(),
      createdBy: req.user ? req.user.id : undefined
    })
    await skill.save()
    
    res.status(201).json(skill)
  } catch (err) {
    next(err)
  }
}

// Get all skills sorted by name
exports.getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ name: 1 })
    res.json(skills)
  } catch (err) {
    next(err)
  }
}

// Update skill
exports.updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'Skill name is required' })

    const skill = await Skill.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    )
    res.json(skill)
  } catch (err) {
    next(err)
  }
}

// Delete skill
exports.deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params
    await Skill.findByIdAndDelete(id)
    res.json({ message: 'Skill deleted' })
  } catch (err) {
    next(err)
  }
}
