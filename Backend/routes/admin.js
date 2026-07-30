const express = require('express')
const router = express.Router()
const c = require('../controllers/adminController')

// Stats + Charts + Reports
router.get('/stats', c.getStats)
router.get('/charts', c.getChartData)
router.get('/reports', c.getReports)

// Admin Notifications
router.get('/notifications', c.getAdminNotifications)
router.put('/notifications/:id/read', c.markAdminNotificationRead)
router.delete('/notifications/:id', c.deleteAdminNotification)

// Student management
router.post('/students', c.createStudent)
router.get('/students', c.getAllStudents)
router.get('/students/:id/profile', c.getStudentProfile)
router.get('/students/:id', c.getStudentById)
router.put('/students/:id', c.updateStudent)
router.delete('/students/:id', c.deleteStudent)
router.put('/students/:id/suspend', c.suspendStudent)
router.put('/students/:id/activate', c.activateStudent)
router.put('/students/:id/rate-course', c.rateStudentCourse)

// Course Directory management
router.get('/courses', c.getCourses)
router.post('/courses', c.createCourse)
router.put('/courses/:id', c.updateCourse)
router.delete('/courses/:id', c.deleteCourse)

// Skill management
router.get('/skills', c.getAllSkills)
router.post('/skills', c.createSkill)
router.put('/skills/rename', c.editSkill)
router.delete('/skills/:name', c.deleteSkill)

// Request management
router.get('/requests', c.getAllRequests)
router.put('/requests/:id/approve', c.approveRequest)
router.put('/requests/:id/reject', c.rejectRequest)
router.delete('/requests/:id', c.deleteRequest)

module.exports = router
