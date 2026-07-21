const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { getProfile, updateProfile, searchUsers, addSkillToProfile, removeSkillFromProfile, getUserById, getPublicStats } = require('../controllers/userController')

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.get('/search', searchUsers)               // public – no token needed for discovery
router.post('/profile/skills', protect, addSkillToProfile)
router.delete('/profile/skills', protect, removeSkillFromProfile)
router.get('/public-stats', getPublicStats)
router.get('/:id', getUserById)                  // public – view any user profile

module.exports = router
