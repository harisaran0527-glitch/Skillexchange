const express = require('express')
const router = express.Router()
const { searchByCourse, getSearchSuggestions } = require('../controllers/searchController')

router.get('/', searchByCourse)
router.get('/suggestions', getSearchSuggestions)

module.exports = router
