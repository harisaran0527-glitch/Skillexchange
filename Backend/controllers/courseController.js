const Course = require('../models/Course')

// GET /api/courses - list all courses
exports.getCourses = async (req, res, next) => {
  try {
    const { q, category } = req.query
    const where = {}
    if (q) where.name = { $regex: q, $options: 'i' }
    if (category) where.category = category

    const courses = await Course.find(where).sort({ name: 1 })
    res.json(courses)
  } catch (err) { next(err) }
}

// GET /api/courses/:id
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })
    res.json(course)
  } catch (err) { next(err) }
}

// POST /api/admin/courses - create course (admin)
exports.createCourse = async (req, res, next) => {
  try {
    const { name, description, category, icon } = req.body
    if (!name) return res.status(400).json({ message: 'Course name is required' })
    const existing = await Course.findOne({ name: name.trim() })
    if (existing) return res.status(400).json({ message: 'Course already exists' })
    const course = new Course({
      name: name.trim(), description: description || '', category: category || 'General', icon: icon || ''
    })
    await course.save()
    res.status(201).json(course)
  } catch (err) { next(err) }
}

// PUT /api/admin/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    const { name, description, category, icon, isActive } = req.body
    const updateData = { ...(name && { name }), ...(description !== undefined && { description }), ...(category && { category }), ...(icon !== undefined && { icon }), ...(isActive !== undefined && { isActive }) }
    const course = await Course.findByIdAndUpdate(req.params.id, updateData, { new: true })
    res.json(course)
  } catch (err) { next(err) }
}

// DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    await Course.findByIdAndDelete(req.params.id)
    res.json({ message: 'Course deleted successfully' })
  } catch (err) { next(err) }
}
