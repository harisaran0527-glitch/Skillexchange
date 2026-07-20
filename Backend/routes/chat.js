const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { getConversation, sendMessage } = require('../controllers/chatController')

router.use(protect)

router.get('/:userId', getConversation)
router.post('/', sendMessage)

module.exports = router
