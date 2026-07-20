const User = require('../models/User')
const Course = require('../models/Course')
const bcrypt = require('bcryptjs')
const LearningRequest = require('../models/LearningRequest')
const Notification = require('../models/Notification')
const { createNotification } = require('./notificationController')

// ── CREATE STUDENT (Admin) ────────────────────────────────────────────
exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, department, section, year, college, skillsOffered, profileImage, completedCourses, portfolioLinks, socialLinks, availability } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' })

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) return res.status(400).json({ message: 'Email already in use' })

    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash(password, salt)

    const student = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        department: department || '',
        section: section || '',
        year: year || '',
        college: college || '',
        profileImage: profileImage || '',
        skillsOffered: Array.isArray(skillsOffered) ? skillsOffered : [],
        completedCourses: Array.isArray(completedCourses) ? completedCourses : [],
        portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks : [],
        socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
        availability: availability || 'available'
    })
    await student.save()

    const studentObj = student.toObject()
    delete studentObj.password
    res.status(201).json(studentObj)
  } catch (err) { next(err) }
}

// ── GET FULL STUDENT PROFILE ──────────────────────────────────────────
exports.getStudentProfile = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password')
    if (!student) return res.status(404).json({ message: 'Student not found' })

    // In mongoose, we need to fetch related data separately or use populate if refs were set.
    // For now, fetch requests manually.
    const requestsSent = await LearningRequest.find({ studentId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(10)
        
    const requestsReceived = await LearningRequest.find({ tutorId: req.params.id })
        .sort({ createdAt: -1 })
        .limit(10)

    // Optional: fetch reviewsReceived if Review model exists
    // const Review = require('../models/Review')
    // const reviewsReceived = await Review.find({ revieweeId: req.params.id }).sort({ createdAt: -1 })

    const studentObj = student.toObject()
    studentObj.requestsSent = requestsSent
    studentObj.requestsReceived = requestsReceived
    studentObj.reviewsReceived = [] // placeholder
    
    res.json(studentObj)
  } catch (err) { next(err) }
}

// ── GET COURSE DIRECTORY (admin) ──────────────────────────────────────
exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ name: 1 })
    res.json(courses)
  } catch (err) { next(err) }
}

exports.createCourse = async (req, res, next) => {
  try {
    const { name, description, category, icon } = req.body
    if (!name) return res.status(400).json({ message: 'Course name required' })
    const existing = await Course.findOne({ name: name.trim() })
    if (existing) return res.status(400).json({ message: 'Course already exists' })
    
    const course = new Course({ name: name.trim(), description: description || '', category: category || 'General', icon: icon || '' })
    await course.save()
    res.status(201).json(course)
  } catch (err) { next(err) }
}

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(course)
  } catch (err) { next(err) }
}

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
    if (course) {
      await createNotification({
        senderId: req.admin?.id || 'admin',
        receiverId: 'admin',
        message: `Course deleted: ${course.name}`,
        notificationType: 'System Notification'
      }, req.io)
    }
    await Course.findByIdAndDelete(req.params.id)
    res.json({ message: 'Course deleted' })
  } catch (err) { next(err) }
}

// ── STATS ────────────────────────────────────────────────────────────
exports.getStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments()
    const activeStudents = await User.countDocuments({ isSuspended: false })
    const inactiveStudents = await User.countDocuments({ isSuspended: true })

    const usersWithSkills = await User.find({}).select('skillsOffered department')
    
    const allSkillsSet = new Set()
    const departmentSet = new Set()
    usersWithSkills.forEach(u => {
      if (u.skillsOffered) {
          u.skillsOffered.forEach(s => allSkillsSet.add(s.toLowerCase().trim()))
      }
      if (u.department && u.department.trim()) departmentSet.add(u.department.trim())
    })

    const totalRequests = await LearningRequest.countDocuments()
    const pendingRequests = await LearningRequest.countDocuments({ status: 'Pending' })
    const approvedRequests = await LearningRequest.countDocuments({ status: 'Accepted' })
    const rejectedRequests = await LearningRequest.countDocuments({ status: 'Rejected' })

    res.json({
      totalStudents,
      activeStudents,
      inactiveStudents,
      totalSkills: allSkillsSet.size,
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalDepartments: departmentSet.size,
      totalMessages: totalRequests,
    })
  } catch (err) {
    next(err)
  }
}

// ── CHART DATA ───────────────────────────────────────────────────────
exports.getChartData = async (req, res, next) => {
  try {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    // Last 6 months registration trend
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0,0,0,0)

    const recentUsers = await User.find({ createdAt: { $gte: sixMonthsAgo } }).select('createdAt')

    const registrationsByMonth = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthIndex = d.getMonth()
      const year = d.getFullYear()

      const count = recentUsers.filter(u => {
        const uDate = new Date(u.createdAt)
        return uDate.getMonth() === monthIndex && uDate.getFullYear() === year
      }).length

      registrationsByMonth.push({ month: months[monthIndex], count })
    }

    // Department distribution
    const deptGroups = await User.aggregate([
      { $match: { department: { $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ])
    
    const departmentDistribution = deptGroups.map(d => ({
      name: d._id,
      value: d.count
    }))

    // Popular skills
    const allUsers = await User.find({}).select('skillsOffered')
    const skillCount = {}
    allUsers.forEach(u => {
      if (u.skillsOffered) {
          u.skillsOffered.forEach(s => { const k = s.trim(); skillCount[k] = (skillCount[k] || 0) + 1 })
      }
    })
    const popularSkills = Object.entries(skillCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }))

    // Skills distribution
    let totalOffered = 0
    allUsers.forEach(u => { if(u.skillsOffered) totalOffered += u.skillsOffered.length })

    // Request status breakdown
    const requestStatus = [
      { status: 'Pending', count: await LearningRequest.countDocuments({ status: 'Pending' }) },
      { status: 'Approved', count: await LearningRequest.countDocuments({ status: 'Accepted' }) },
      { status: 'Rejected', count: await LearningRequest.countDocuments({ status: 'Rejected' }) }
    ]

    // Active vs Inactive
    const activeCount = await User.countDocuments({ isSuspended: false })
    const inactiveCount = await User.countDocuments({ isSuspended: true })

    res.json({
      registrationsByMonth,
      departmentDistribution,
      popularSkills,
      skillsDistribution: [
        { name: 'Skills Offered', value: totalOffered }
      ],
      requestStatus,
      activeVsInactive: [
        { name: 'Active', value: activeCount },
        { name: 'Inactive', value: inactiveCount }
      ]
    })
  } catch (err) {
    next(err)
  }
}

// ── STUDENT MANAGEMENT ───────────────────────────────────────────────
exports.getAllStudents = async (req, res, next) => {
  try {
    const { q, department, year, status, page = 1, limit = 10 } = req.query
    const where = {}

    if (q) {
      where.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    }
    if (department) where.department = department
    if (year) where.year = year
    if (status === 'active') where.isSuspended = false
    if (status === 'suspended') where.isSuspended = true

    const total = await User.countDocuments(where)
    const students = await User.find(where)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .select('-password')

    res.json({
      students,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    })
  } catch (err) {
    next(err)
  }
}

exports.getStudentById = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id).select('-password')
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (err) {
    next(err)
  }
}

exports.updateStudent = async (req, res, next) => {
  try {
    const updates = { ...req.body }
    delete updates.password
    delete updates.id
    delete updates._id

    const student = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    if (!student) return res.status(404).json({ message: 'Student not found' })
    res.json(student)
  } catch (err) {
    next(err)
  }
}

exports.deleteStudent = async (req, res, next) => {
  try {
    const targetStudent = await User.findById(req.params.id)
    if (targetStudent) {
      await createNotification({
        senderId: req.admin?.id || 'admin',
        receiverId: 'admin',
        message: `Student deleted: ${targetStudent.name} (${targetStudent.email})`,
        notificationType: 'System Notification'
      }, req.io)
    }
    await User.findByIdAndDelete(req.params.id)
    await LearningRequest.deleteMany({
      $or: [{ studentId: req.params.id }, { tutorId: req.params.id }]
    })
    res.json({ message: 'Student deleted successfully' })
  } catch (err) {
    next(err)
  }
}

exports.suspendStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndUpdate(
        req.params.id, 
        { isSuspended: true, isActive: false },
        { new: true }
    ).select('-password')
    res.json({ message: 'Student suspended', student })
  } catch (err) {
    next(err)
  }
}

exports.activateStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndUpdate(
        req.params.id, 
        { isSuspended: false, isActive: true },
        { new: true }
    ).select('-password')
    res.json({ message: 'Student activated', student })
  } catch (err) {
    next(err)
  }
}

// ── SKILL MANAGEMENT ─────────────────────────────────────────────────
exports.getAllSkills = async (req, res, next) => {
  try {
    const users = await User.find().select('skillsOffered')
    const skillMap = {}
    users.forEach(u => {
      if (u.skillsOffered) {
          u.skillsOffered.forEach(s => {
            const k = s.trim()
            if (!skillMap[k]) skillMap[k] = { offered: 0 }
            skillMap[k].offered++
          })
      }
    })
    const skills = Object.entries(skillMap)
      .map(([name, counts]) => ({
        name,
        offered: counts.offered,
        total: counts.offered
      }))
      .sort((a, b) => b.total - a.total)
    res.json(skills)
  } catch (err) {
    next(err)
  }
}

exports.editSkill = async (req, res, next) => {
  try {
    const { oldName, newName } = req.body
    if (!oldName || !newName) return res.status(400).json({ message: 'oldName and newName required' })

    const users = await User.find({ skillsOffered: oldName })
    for (const user of users) {
        user.skillsOffered = user.skillsOffered.map(s => s === oldName ? newName : s)
        await user.save()
    }
    
    res.json({ message: `Skill renamed from "${oldName}" to "${newName}"` })
  } catch (err) {
    next(err)
  }
}

exports.deleteSkill = async (req, res, next) => {
  try {
    const { name } = req.params
    
    const users = await User.find({ skillsOffered: name })
    for (const user of users) {
        user.skillsOffered = user.skillsOffered.filter(s => s !== name)
        await user.save()
    }

    await createNotification({
      senderId: req.admin?.id || 'admin',
      receiverId: 'admin',
      message: `Skill deleted: ${name}`,
      notificationType: 'System Notification'
    }, req.io)
    res.json({ message: `Skill "${name}" removed from all students` })
  } catch (err) {
    next(err)
  }
}

// ── REQUEST MANAGEMENT ───────────────────────────────────────────────
exports.getAllRequests = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const query = {}
    if (status) {
      if (status.toLowerCase() === 'pending') query.status = 'Pending'
      if (status.toLowerCase() === 'approved' || status.toLowerCase() === 'accepted') query.status = 'Accepted'
      if (status.toLowerCase() === 'rejected') query.status = 'Rejected'
    }

    const total = await LearningRequest.countDocuments(query)
    const mRequests = await LearningRequest.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))

    const requests = await Promise.all(mRequests.map(async (r) => {
      const fromUser = await User.findById(r.studentId).select('name email department')
      const toUser = await User.findById(r.tutorId).select('name email department')
      return {
        id: r._id.toString(),
        _id: r._id.toString(),
        skill: r.courseName,
        courseName: r.courseName,
        status: r.status.toLowerCase() === 'accepted' ? 'approved' : r.status.toLowerCase(),
        createdAt: r.createdAt,
        fromUser: fromUser || { name: r.studentName, email: '', department: r.department || '' },
        toUser: toUser || { name: r.tutorName, email: '', department: '' }
      }
    }))

    res.json({
      requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit))
    })
  } catch (err) {
    next(err)
  }
}

exports.approveRequest = async (req, res, next) => {
  try {
    const request = await LearningRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Accepted' },
      { new: true }
    )
    if (!request) return res.status(404).json({ message: 'Request not found' })
    res.json({ message: 'Request approved', request })
  } catch (err) {
    next(err)
  }
}

exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await LearningRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected' },
      { new: true }
    )
    if (!request) return res.status(404).json({ message: 'Request not found' })
    res.json({ message: 'Request rejected', request })
  } catch (err) {
    next(err)
  }
}

exports.deleteRequest = async (req, res, next) => {
  try {
    const request = await LearningRequest.findById(req.params.id)
    if (request) {
      await createNotification({
        senderId: req.admin?.id || 'admin',
        receiverId: 'admin',
        message: `Learning request deleted: from ${request.studentName} to ${request.tutorName} for ${request.courseName}`,
        notificationType: 'System Notification'
      }, req.io)
    }
    await LearningRequest.findByIdAndDelete(req.params.id)
    res.json({ message: 'Request deleted' })
  } catch (err) {
    next(err)
  }
}

// ── ADMIN NOTIFICATIONS ──────────────────────────────────────────────
exports.getAdminNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ receiverId: 'admin' })
      .sort({ createdAt: -1 })
      .limit(50)
    res.json(notifications)
  } catch (err) {
    next(err)
  }
}

exports.markAdminNotificationRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { status: 'Read', read: true })
    res.json({ message: 'Notification marked as read' })
  } catch (err) {
    next(err)
  }
}

exports.deleteAdminNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id)
    res.json({ message: 'Notification deleted' })
  } catch (err) {
    next(err)
  }
}

// ── REPORTS ──────────────────────────────────────────────────────────
exports.getReports = async (req, res, next) => {
  try {
    const { type } = req.query // monthly | students | skills | departments

    if (type === 'students') {
      const students = await User.find().sort({ createdAt: -1 }).select('-password')
      return res.json({ students })
    }

    if (type === 'skills') {
      const users = await User.find().select('skillsOffered')
      const skillMap = {}
      users.forEach(u => {
        if (u.skillsOffered) {
            u.skillsOffered.forEach(s => { skillMap[s] = (skillMap[s] || { offered: 0 }); skillMap[s].offered++ })
        }
      })
      const skills = Object.entries(skillMap)
        .map(([name, v]) => ({ name, ...v, total: v.offered }))
        .sort((a,b) => b.total - a.total)
      return res.json({ skills })
    }

    if (type === 'departments') {
      const deptGroups = await User.aggregate([
        { $match: { department: { $ne: '' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
      
      const departments = deptGroups.map(d => ({
        name: d._id,
        count: d.count
      }))
      return res.json({ departments })
    }

    // Default: monthly registrations (current year)
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const thisYear = new Date().getFullYear()
    const startOfYear = new Date(thisYear, 0, 1)

    const currentYearUsers = await User.find({ createdAt: { $gte: startOfYear } }).select('createdAt')

    const monthly = months.map((m, i) => {
      const count = currentYearUsers.filter(u => {
        const uDate = new Date(u.createdAt)
        return uDate.getMonth() === i && uDate.getFullYear() === thisYear
      }).length

      return {
        month: m,
        registrations: count
      }
    })

    res.json({ monthly })
  } catch (err) {
    next(err)
  }
}
