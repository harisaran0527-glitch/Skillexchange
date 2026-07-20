const express = require('express')
const router = express.Router()
const { adminLogin, adminMe, changePassword, updateAdminProfile } = require('../controllers/adminAuthController')
const { adminProtect } = require('../middleware/adminMiddleware')

router.post('/login', adminLogin)
router.get('/me', adminProtect, adminMe)
router.put('/change-password', adminProtect, changePassword)
router.put('/update-profile', adminProtect, updateAdminProfile)

module.exports = router
