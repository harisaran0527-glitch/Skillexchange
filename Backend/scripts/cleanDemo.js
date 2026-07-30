require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const mongoose = require('mongoose')
const User = require('../models/User')
const LearningRequest = require('../models/LearningRequest')
const Request = require('../models/Request')

async function cleanDemo() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('MongoDB URI not configured.')
    process.exit(1)
  }
  await mongoose.connect(uri)
  console.log('Connected to MongoDB. Cleaning demo data...')

  // Remove demo students
  const resUsers = await User.deleteMany({ email: { $regex: /@demo\.com$/i } })
  console.log(`Deleted ${resUsers.deletedCount} demo users.`)

  // Remove demo requests
  const resRequests = await LearningRequest.deleteMany({})
  console.log(`Deleted ${resRequests.deletedCount} learning requests.`)

  const resReq = await Request.deleteMany({})
  console.log(`Deleted ${resReq.deletedCount} general requests.`)

  console.log('Demo data clean complete.')
  await mongoose.disconnect()
}

cleanDemo().catch(err => {
  console.error(err)
  process.exit(1)
})
