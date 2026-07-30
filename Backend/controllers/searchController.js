const Course = require('../models/Course')
const User = require('../models/User')

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// GET /api/search?q=python
// Returns students and courses matching the query
exports.searchByCourse = async (req, res, next) => {
  try {
    const { q } = req.query
    const currentUserId = req.user?.id

    if (!q || !q.trim()) {
      const allCourses = await Course.find({}).sort({ name: 1 })
      const studentQuery = { isSuspended: false }
      if (currentUserId) {
        studentQuery._id = { $ne: currentUserId }
      }
      const allStudents = await User.find(studentQuery)
        .select('name email department section year college profileImage skillsOffered completedCourses availability rating reviewCount')
      const enrichedAll = allStudents.map(st => {
        const s = st.toObject()
        return { ...s, matchPercentage: 80, skillLevel: 'Intermediate', id: s._id.toString() }
      })
      return res.json({ students: enrichedAll, courses: allCourses })
    }

    const query = q.trim()
    const lower = query.toLowerCase()

    // Alias Mappings
    const aliasMap = {
      'cpp': 'C++',
      'cplusplus': 'C++',
      'c plus plus': 'C++',
      'csharp': 'C#',
      'c sharp': 'C#',
      'html': 'HTML & CSS',
      'css': 'HTML & CSS',
      'html/css': 'HTML & CSS',
      'html&css': 'HTML & CSS',
      'html and css': 'HTML & CSS',
      'js': 'JavaScript',
      'py': 'Python',
      'node': 'Node.js',
      'nodejs': 'Node.js'
    }

    const courseConditions = [{ name: { $regex: escapeRegex(query), $options: 'i' } }]

    if (aliasMap[lower]) {
      courseConditions.push({ name: aliasMap[lower] })
    }

    const courses = await Course.find({
      $or: courseConditions
    })

    const courseNames = courses.map(c => new RegExp(`^${escapeRegex(c.name)}$`, 'i'))
    const searchRegex = new RegExp(escapeRegex(query), 'i')

    const studentOrConditions = [
      { skillsOffered: searchRegex },
      { completedCourses: searchRegex }
    ]

    if (courseNames.length > 0) {
      studentOrConditions.push({ skillsOffered: { $in: courseNames } })
      studentOrConditions.push({ completedCourses: { $in: courseNames } })
    }

    if (aliasMap[lower]) {
      const targetName = aliasMap[lower]
      const targetRegex = new RegExp(escapeRegex(targetName), 'i')
      studentOrConditions.push({ skillsOffered: targetRegex })
      studentOrConditions.push({ completedCourses: targetRegex })
    }

    const studentQuery = {
      isSuspended: false,
      $or: studentOrConditions
    }

    if (currentUserId) {
      studentQuery._id = { $ne: currentUserId }
    }

    const students = await User.find(studentQuery)
      .select('name email department section year college profileImage skillsOffered completedCourses availability rating reviewCount')

    const enriched = students.map(st => {
      const s = st.toObject()
      const offered = (s.skillsOffered || []).map(x => x.toLowerCase())
      const completed = (s.completedCourses || []).map(x => x.toLowerCase())
      const direct = offered.includes(lower) || completed.includes(lower)
      const partial = offered.some(x => x.includes(lower) || lower.includes(x))
      const matchPercentage = direct ? 95 : partial ? 70 : 50
      const skillLevel = (s.completedCourses || []).some(x => x.toLowerCase().includes(lower))
        ? 'Expert' : (s.skillsOffered || []).some(x => x.toLowerCase().includes(lower))
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

    const escaped = escapeRegex(q.trim())
    const courses = await Course.find({
      name: { $regex: escaped, $options: 'i' }
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

