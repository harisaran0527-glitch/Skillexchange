const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/authMiddleware')
const { createSkill, getSkills, updateSkill, deleteSkill } = require('../controllers/skillController')

router.post('/', protect, createSkill)
router.get('/', getSkills)
router.put('/:id', protect, updateSkill)
router.delete('/:id', protect, deleteSkill)

module.exports = router
