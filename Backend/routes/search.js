const express = require('express')
const router = express.Router()
const { searchByCourse, getSearchSuggestions } = require('../controllers/searchController')
const { optionalProtect } = require('../middleware/authMiddleware')

router.get('/', optionalProtect, searchByCourse)
router.get('/suggestions', optionalProtect, getSearchSuggestions)

module.exports = router
