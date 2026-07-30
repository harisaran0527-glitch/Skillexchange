const User = require('../models/User')
const Review = require('../models/Review')
const bcrypt = require('bcryptjs')
const { sendSessionRequestEmail, sendSessionAcceptedEmail } = require('./emailController')
const { createNotification } = require('./notificationController')
const LearningRequest = require('../models/LearningRequest')

// POST /api/requests - Book a learning session (student sends request)
exports.createRequest = async (req, res, next) => {
  try {
    const { toUserId, skill, courseName, message } = req.body
    if (!toUserId || !skill) return res.status(400).json({ message: 'toUserId and skill are required' })
    if (toUserId.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: 'You cannot send a teaching request to yourself.' })
    }

    const [fromUser, toUser] = await Promise.all([
      User.findById(req.user.id),
      User.findById(toUserId)
    ])
    if (!toUser) return res.status(404).json({ message: 'Target student not found' })

    // Check duplicate pending
    const existing = await LearningRequest.findOne({
      studentId: req.user.id,
      tutorId: toUserId,
      courseName: courseName || skill,
      status: { $in: ['PENDING', 'Pending'] }
    })
    if (existing) return res.status(400).json({ message: 'You already have a pending teaching request for this course.' })

    const now = new Date()
    const request = new LearningRequest({
      studentId: req.user.id,
      tutorId: toUserId,
      studentName: fromUser.name,
      tutorName: toUser.name,
      courseName: courseName || skill,
      department: fromUser.department,
      section: fromUser.section,
      status: 'PENDING',
      requestDate: now.toLocaleDateString(),
      requestTime: now.toLocaleTimeString(),
      message: message || ''
    })
    await request.save()

    // Create in-app notification for the target student
    await createNotification({
      senderId: req.user.id,
      receiverId: toUserId,
      requestId: request._id.toString(),
      courseName: courseName || skill,
      message: `${fromUser.name} requested your help to learn ${courseName || skill}`,
      notificationType: 'Learning Request'
    }, req.io)

    // Admin notification
    await createNotification({
      senderId: req.user.id,
      receiverId: 'admin',
      requestId: request._id.toString(),
      courseName: courseName || skill,
      message: `New Teaching Request: ${fromUser.name} -> ${toUser.name} (${courseName || skill})`,
      notificationType: 'System Notification'
    }, req.io)

    // Send email notification
    if (toUser.email) {
      sendSessionRequestEmail({
        toEmail: toUser.email,
        toName: toUser.name,
        fromName: fromUser.name,
        courseName: courseName || skill
      }).catch(err => console.warn('[Email] Failed:', err.message))
    }

    res.status(201).json({ message: 'Teaching request sent successfully!', request })
  } catch (err) { next(err) }
}

// GET /api/requests/received - requests sent TO the current user
exports.getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await LearningRequest.find({ tutorId: req.user.id }).sort({ createdAt: -1 })
    
    const enriched = await Promise.all(requests.map(async (r) => {
      const fromUser = await User.findById(r.studentId).select('name email department year profileImage rating')
      const rawStatus = (r.status || '').toUpperCase()
      const normalizedStatus = (rawStatus === 'ACCEPTED' || rawStatus === 'APPROVED') ? 'APPROVED' : (rawStatus === 'REJECTED') ? 'REJECTED' : 'PENDING'
      return { ...r.toObject(), id: r._id.toString(), status: normalizedStatus, fromUser }
    }))
    res.json(enriched)
  } catch (err) { next(err) }
}

// GET /api/requests/sent - requests the current user sent
exports.getSentRequests = async (req, res, next) => {
  try {
    const requests = await LearningRequest.find({ studentId: req.user.id }).sort({ createdAt: -1 })
    
    const enriched = await Promise.all(requests.map(async (r) => {
      const toUser = await User.findById(r.tutorId).select('name email department year profileImage rating')
      const rawStatus = (r.status || '').toUpperCase()
      const normalizedStatus = (rawStatus === 'ACCEPTED' || rawStatus === 'APPROVED') ? 'APPROVED' : (rawStatus === 'REJECTED') ? 'REJECTED' : 'PENDING'
      return { ...r.toObject(), id: r._id.toString(), status: normalizedStatus, toUser }
    }))
    res.json(enriched)
  } catch (err) { next(err) }
}

// PUT /api/requests/:id/accept
exports.acceptRequest = async (req, res, next) => {
  try {
    const request = await LearningRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request not found' })
    if (request.tutorId !== req.user.id) return res.status(403).json({ message: 'Not authorized' })
    if (request.status !== 'PENDING' && request.status !== 'Pending') return res.status(400).json({ message: 'Request already responded to' })

    request.status = 'APPROVED'
    await request.save()

    const fromUser = await User.findById(request.studentId)
    const toUser = await User.findById(request.tutorId)

    // Notify the requester
    await createNotification({
      senderId: req.user.id,
      receiverId: request.studentId,
      requestId: request._id.toString(),
      courseName: request.courseName,
      message: `${toUser.name} accepted your request for ${request.courseName}`,
      notificationType: 'Accepted'
    }, req.io)

    // Send email to the requester
    if (fromUser && fromUser.email) {
      sendSessionAcceptedEmail({
        toEmail: fromUser.email,
        toName: fromUser.name,
        acceptorName: toUser.name,
        courseName: request.courseName
      }).catch(() => {})
    }

    res.json({ message: 'Request approved!', request })
  } catch (err) { next(err) }
}

// PUT /api/requests/:id/reject
exports.rejectRequest = async (req, res, next) => {
  try {
    const request = await LearningRequest.findById(req.params.id)
    if (!request) return res.status(404).json({ message: 'Request not found' })
    if (request.tutorId !== req.user.id) return res.status(403).json({ message: 'Not authorized' })

    request.status = 'REJECTED'
    await request.save()

    const toUser = await User.findById(request.tutorId)

    await createNotification({
      senderId: req.user.id,
      receiverId: request.studentId,
      requestId: request._id.toString(),
      courseName: request.courseName,
      message: `${toUser.name} rejected your request for ${request.courseName}`,
      notificationType: 'Rejected'
    }, req.io)

    res.json({ message: 'Request rejected', request })
  } catch (err) { next(err) }
}

// POST /api/requests/:id/review - leave a review after session
exports.leaveReview = async (req, res, next) => {
  try {
    const { rating, comment, revieweeId } = req.body
    if (!rating || !revieweeId) return res.status(400).json({ message: 'rating and revieweeId required' })

    const review = new Review({
      reviewerId: req.user.id,
      revieweeId,
      rating: Number(rating),
      comment: comment || ''
    })
    
    await review.save()

    // Update user's average rating
    const reviews = await Review.find({ revieweeId })
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    
    await User.findByIdAndUpdate(
      revieweeId,
      { rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length }
    )

    res.status(201).json(review)
  } catch (err) { next(err) }
}
