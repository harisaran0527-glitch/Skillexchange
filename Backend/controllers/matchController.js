const User = require('../models/User')

// Simple matching algorithm:
// For each other student, compute matching score based on skills/courses overlaps
exports.getMatches = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user.id)
    if (!currentUser) return res.status(404).json({ message: 'User not found' })

    const others = await User.find({
      _id: { $ne: currentUser._id }
    })

    const results = others.map(otherUser => {
      const other = otherUser.toObject()
      const cOffered = currentUser.skillsOffered || []
      const oOffered = other.skillsOffered || []
      const cCourses = (currentUser.completedCourses || []).map(c => c.toLowerCase())
      const oCourses = (other.completedCourses || []).map(c => c.toLowerCase())

      // Skills overlap: skills both users offer
      const skillOverlap = oOffered.filter(s => cOffered.includes(s))
      // Course overlap: courses both users completed
      const courseOverlap = oCourses.filter(c => cCourses.includes(c))

      const totalRelevant = new Set([
        ...cOffered, ...oOffered, ...cCourses, ...oCourses
      ]).size || 1
      
      const score = Math.round(((skillOverlap.length + courseOverlap.length) / totalRelevant) * 100)
      const common = Array.from(new Set([ ...skillOverlap, ...courseOverlap ]))

      return {
        user: {
          id: other._id.toString(),
          name: other.name,
          department: other.department,
          section: other.section,
          year: other.year,
          college: other.college,
          profileImage: other.profileImage,
          availability: other.availability
        },
        matchPercentage: score,
        commonSkills: common,
        details: {
          skillOverlap,
          courseOverlap
        }
      }
    })

    // Sort by highest match
    results.sort((a, b) => b.matchPercentage - a.matchPercentage)

    res.json(results)
  } catch (err) {
    next(err)
  }
}
