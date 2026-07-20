const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  createRequest, getReceivedRequests, getSentRequests,
  acceptRequest, rejectRequest, leaveReview
} = require('../controllers/requestController')

router.post('/', protect, createRequest)
router.get('/received', protect, getReceivedRequests)
router.get('/sent', protect, getSentRequests)
router.put('/:id/accept', protect, acceptRequest)
router.put('/:id/reject', protect, rejectRequest)
router.post('/review', protect, leaveReview)

module.exports = router
