const Course = require('../models/Course')
const User = require('../models/User')

// GET /api/search?q=python
// Returns students who have this course in skillsOffered or completedCourses
exports.searchByCourse = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q || q.trim().length < 1) {
      return res.json({ students: [], courses: [] })
    }
    const query = q.trim()

    // Find matching courses first
    const courses = await Course.find({
      name: { $regex: query, $options: 'i' },
      isActive: true
    }).limit(5)

    const courseNames = courses.map(c => new RegExp(`^${c.name}$`, 'i'))

    // Find students who offer or have completed the searched skill/course
    const students = await User.find({
      isSuspended: false,
      $or: [
        { skillsOffered: { $regex: query, $options: 'i' } },
        { completedCourses: { $regex: query, $options: 'i' } },
        { skillsOffered: { $in: courseNames } },
        { completedCourses: { $in: courseNames } },
      ]
    }).select('name email department section year college profileImage skillsOffered completedCourses availability rating reviewCount')

    // Compute match percentage for each student against the query
    const enriched = students.map(st => {
      const s = st.toObject()
      const offered = (s.skillsOffered || []).map(x => x.toLowerCase())
      const completed = (s.completedCourses || []).map(x => x.toLowerCase())
      const q_lower = query.toLowerCase()
      const direct = offered.includes(q_lower) || completed.includes(q_lower)
      const partial = offered.some(x => x.includes(q_lower) || q_lower.includes(x))
      const matchPercentage = direct ? 95 : partial ? 70 : 50
      const skillLevel = (s.completedCourses || []).some(x => x.toLowerCase().includes(q_lower))
        ? 'Expert' : (s.skillsOffered || []).some(x => x.toLowerCase().includes(q_lower))
        ? 'Intermediate' : 'Beginner'
      return { ...s, matchPercentage, skillLevel, id: s._id.toString() }
    })

    enriched.sort((a, b) => b.matchPercentage - a.matchPercentage)

    res.json({ students: enriched, courses })
  } catch (err) { next(err) }
}

// GET /api/search/suggestions?q=py - for autocomplete dropdown
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q } = req.query
    if (!q || q.length < 1) return res.json([])

    const courses = await Course.find({
      name: { $regex: q, $options: 'i' },
      isActive: true
    })
    .select('name category')
    .sort({ name: 1 })
    .limit(8)

    const result = courses.map(c => ({
        id: c._id,
        name: c.name,
        category: c.category
    }))

    res.json(result)
  } catch (err) { next(err) }
}
