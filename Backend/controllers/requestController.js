const User = require('../models/User')
const Review = require('../models/Review')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { sendSessionRequestEmail, sendSessionAcceptedEmail } = require('./emailController')
const { createNotification } = require('./notificationController')
const LearningRequest = require('../models/LearningRequest')

// Helper to render mobile-friendly HTML confirmation page
function renderConfirmationHtml(title, headline, statusBadge) {
  const badgeBg = statusBadge === 'APPROVED' ? 'linear-gradient(135deg, #10b981, #059669)' : statusBadge === 'REJECTED' ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #64748b, #475569)'
  const icon = statusBadge === 'APPROVED' ? '✓' : statusBadge === 'REJECTED' ? '✕' : 'ℹ'
  const accentColor = statusBadge === 'APPROVED' ? '#10b981' : statusBadge === 'REJECTED' ? '#f43f5e' : '#60a5fa'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} – SkillExchange</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0d1a;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111322;
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 24px;
      padding: 48px 32px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .brand {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: ${accentColor};
      margin-bottom: 24px;
    }
    .icon-badge {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: ${badgeBg};
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
      font-weight: 900;
      margin: 0 auto 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.4;
      margin-bottom: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">SkillExchange</div>
    <div class="icon-badge">${icon}</div>
    <h1>${headline}</h1>
  </div>
</body>
</html>`
}

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

    // Validate selected teacher's database email from MongoDB
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const teacherEmail = (toUser.email || '').trim()

    if (!teacherEmail || !emailRegex.test(teacherEmail)) {
      console.warn(`[Teaching Request] Failed: Selected teacher (${toUser.name}, ID: ${toUserId}) does not have a valid email address.`)
      return res.status(400).json({ message: 'Selected teacher does not have a valid email address.' })
    }

    // Check duplicate pending
    const existing = await LearningRequest.findOne({
      studentId: req.user.id,
      tutorId: toUserId,
      courseName: courseName || skill,
      status: { $in: ['PENDING', 'Pending'] }
    })
    if (existing) return res.status(400).json({ message: 'You already have a pending teaching request for this course.' })

    // Generate single-use secure action token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')
    const actionTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiry

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
      message: message || '',
      actionTokenHash: hashedToken,
      actionTokenExpiry,
      tokenUsed: false
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

    // Determine host base URL for email link
    const host = req.get('host')
    const protocol = req.protocol || 'http'
    const baseUrl = `${protocol}://${host}`

    // Send email notification to teacher's saved database email
    sendSessionRequestEmail({
      toEmail: teacherEmail,
      toName: toUser.name,
      fromName: fromUser.name,
      courseName: courseName || skill,
      rawToken,
      baseUrl
    }).catch(err => console.warn('[Email] Notification delivery warning:', err.message))

    res.status(201).json({ message: 'Teaching request sent successfully!', request })
  } catch (err) { next(err) }
}

// GET /api/requests/email-action?token=SECURE_TOKEN&action=approve|reject
exports.emailAction = async (req, res, next) => {
  try {
    const { token, action } = req.query
    if (!token || !action || !['approve', 'reject'].includes(action)) {
      return res.status(400).send(renderConfirmationHtml('Invalid Action', 'This request link has expired.', 'EXPIRED'))
    }

    const hashedToken = crypto.createHash('sha256').update(String(token).trim()).digest('hex')
    const request = await LearningRequest.findOne({ actionTokenHash: hashedToken })

    if (!request) {
      return res.status(400).send(renderConfirmationHtml('Expired Link', 'This request link has expired.', 'EXPIRED'))
    }

    // Check if token already used or expired
    if (request.tokenUsed) {
      return res.status(400).send(renderConfirmationHtml('Already Answered', 'This request has already been answered.', 'USED'))
    }

    if (request.actionTokenExpiry && new Date(request.actionTokenExpiry) < new Date()) {
      return res.status(400).send(renderConfirmationHtml('Expired Link', 'This request link has expired.', 'EXPIRED'))
    }

    const currentStatus = (request.status || '').toUpperCase()
    if (currentStatus !== 'PENDING') {
      return res.status(400).send(renderConfirmationHtml('Already Answered', 'This request has already been answered.', 'USED'))
    }

    const teacher = await User.findById(request.tutorId)
    const teacherName = teacher ? teacher.name : request.tutorName

    if (action === 'approve') {
      request.status = 'APPROVED'
      request.tokenUsed = true
      await request.save()

      // Notify requester
      await createNotification({
        senderId: request.tutorId,
        receiverId: request.studentId,
        requestId: request._id.toString(),
        courseName: request.courseName,
        message: `${teacherName} accepted your request for ${request.courseName}`,
        notificationType: 'Accepted'
      }, req.io)

      // Send accepted email to requester if email available
      const requester = await User.findById(request.studentId)
      if (requester && requester.email) {
        sendSessionAcceptedEmail({
          toEmail: requester.email,
          toName: requester.name,
          acceptorName: teacherName,
          courseName: request.courseName
        }).catch(() => {})
      }

      return res.status(200).send(renderConfirmationHtml('Request Approved', 'Teaching request approved successfully.', 'APPROVED'))
    } else if (action === 'reject') {
      request.status = 'REJECTED'
      request.tokenUsed = true
      await request.save()

      // Notify requester
      await createNotification({
        senderId: request.tutorId,
        receiverId: request.studentId,
        requestId: request._id.toString(),
        courseName: request.courseName,
        message: `${teacherName} rejected your request for ${request.courseName}`,
        notificationType: 'Rejected'
      }, req.io)

      return res.status(200).send(renderConfirmationHtml('Request Rejected', 'Teaching request rejected successfully.', 'REJECTED'))
    }
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

// PUT /api/requests/:id/accept - Disabled from student portal
exports.acceptRequest = async (req, res, next) => {
  return res.status(403).json({ message: 'Teaching requests can only be approved or rejected via the secure link sent to your email.' })
}

// PUT /api/requests/:id/reject - Disabled from student portal
exports.rejectRequest = async (req, res, next) => {
  return res.status(403).json({ message: 'Teaching requests can only be approved or rejected via the secure link sent to your email.' })
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

