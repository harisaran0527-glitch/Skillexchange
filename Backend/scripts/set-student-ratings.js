require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const mongoose = require('mongoose')
const User = require('../models/User')

async function updateRatings() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  await mongoose.connect(uri)

  const users = await User.find({})
  console.log(`Found ${users.length} users. Updating ratings for qualifying students...`)

  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    // Assign 4.8, 4.6, 4.5 ratings to active students
    const ratingVal = 4.8 - (i * 0.2)
    u.rating = Math.max(ratingVal, 4.2)
    u.reviewCount = (i + 1) * 5
    await u.save()
    console.log(`- Updated ${u.name} -> Rating: ${u.rating}`)
  }

  await mongoose.disconnect()
  console.log('✅ Student ratings updated in MongoDB successfully!')
}

updateRatings().catch(console.error)
