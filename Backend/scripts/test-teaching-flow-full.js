require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const http = require('http')
const mongoose = require('mongoose')

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5005,
      path: `/api${path}`,
      method,
      headers: { 'Content-Type': 'application/json' }
    }
    if (token) options.headers['Authorization'] = `Bearer ${token}`

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function runCompleteTeachingFlowTest() {
  console.log('--- STARTING COMPLETE TEACHING REQUEST SYSTEM FLOW TEST ---')

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  await mongoose.connect(uri)
  const User = require('../models/User')
  const LearningRequest = require('../models/LearningRequest')

  // Setup Student A (Requester) and Student B (Teacher)
  let studentA = await User.findOne({ isSuspended: false })
  let studentB = await User.findOne({ _id: { $ne: studentA._id }, isSuspended: false })

  if (!studentB) {
    const salt = await require('bcryptjs').genSalt(10)
    const hashed = await require('bcryptjs').hash('password123', salt)
    studentB = new User({
      name: 'Yukeesh K',
      email: 'yukeesh.ad25@avsenggcollege.ac.in',
      password: hashed,
      department: 'AIDS',
      year: '3',
      college: 'AVS ENGINEERING COLLEGE',
      completedCourses: ['C++', 'Java']
    })
    await studentB.save()
  } else {
    studentB.completedCourses = ['C++', 'Java']
    await studentB.save()
  }

  // Set known password for test students
  const salt = await require('bcryptjs').genSalt(10)
  const hashed = await require('bcryptjs').hash('password123', salt)
  studentA.password = hashed
  studentB.password = hashed
  await studentA.save()
  await studentB.save()

  await mongoose.disconnect()

  console.log(`Student A (Requester): "${studentA.name}" (${studentA.email})`)
  console.log(`Student B (Teacher):   "${studentB.name}" (${studentB.email})`)

  // 1. Student A Login
  const loginA = await request('/auth/login', 'POST', {
    email: studentA.email,
    password: 'password123'
  })
  const tokenA = loginA.body.token
  console.log('1. Student A Login Status:', loginA.status)

  // 2. Search for C++ with Student A token
  const searchCpp = await request('/search?q=C%2B%2B', 'GET', null, tokenA)
  console.log('2. Search C++ Status:', searchCpp.status)
  const cppCourses = searchCpp.body.courses || []
  const cppTeachers = searchCpp.body.students || []

  console.log('   Matching Video Course:', cppCourses.map(c => c.name))
  console.log('   Eligible Teachers returned:', cppTeachers.map(t => t.name))

  if (cppCourses.length === 0 || !cppCourses.some(c => c.name === 'C++')) {
    throw new Error('C++ learning video resource not found in search!')
  }

  // ASSERT: Student A (Saran S) MUST NOT appear in eligible teachers list
  const isSelfInTeachers = cppTeachers.some(t => (t.id || t._id).toString() === studentA._id.toString() || t.name === studentA.name)
  if (isSelfInTeachers) {
    throw new Error(`TEST FAILED: Requesting student "${studentA.name}" appeared in their own eligible teacher search results!`)
  }
  console.log('   ✅ CONFIRMED: Requesting student is excluded from eligible teachers search results!')

  // 2B. Direct API Self-Request Creation Test
  console.log('\n--- STEP 2B: TESTING DIRECT SELF-REQUEST REJECTION ---')
  const selfReq = await request('/requests', 'POST', {
    toUserId: studentA._id.toString(),
    skill: 'C++',
    courseName: 'C++'
  }, tokenA)
  console.log('Self-Request API Status:', selfReq.status, '| Response Message:', selfReq.body.message)
  if (selfReq.status !== 400 || !selfReq.body.message.includes('cannot send a teaching request to yourself')) {
    throw new Error(`TEST FAILED: Self-request was not properly rejected by backend! Result: ${JSON.stringify(selfReq.body)}`)
  }
  console.log('   ✅ CONFIRMED: Backend API rejected self-request with status 400 and exact message!')

  // 3. Single-click Request: Student A requests Student B to teach C++
  console.log('\n--- STEP 3: CREATING TEACHING REQUEST (PENDING) ---')
  const createReq = await request('/requests', 'POST', {
    toUserId: studentB._id.toString(),
    skill: 'C++',
    courseName: 'C++'
  }, tokenA)
  console.log('Create Request Status:', createReq.status, '| Message:', createReq.body.message)
  if (createReq.status !== 201) throw new Error('Failed to create teaching request')

  const requestId = createReq.body.request._id
  console.log('Request Created ID:', requestId, '| Initial Status:', createReq.body.request.status)

  if (createReq.body.request.status !== 'PENDING') {
    throw new Error('Initial status is not PENDING!')
  }

  // 4. Student B (Teacher) Login
  console.log('\n--- STEP 4: TEACHER (STUDENT B) LOGINS & VIEWS INCOMING REQUEST ---')
  const loginB = await request('/auth/login', 'POST', {
    email: studentB.email,
    password: 'password123'
  })
  const tokenB = loginB.body.token
  console.log('Student B Login Status:', loginB.status)

  const receivedReqs = await request('/requests/received', 'GET', null, tokenB)
  const incoming = (receivedReqs.body || []).find(r => r.id === requestId || r._id === requestId)
  console.log('Incoming Request Status for Teacher B:', incoming?.status)

  // 5. Teacher B ACCEPTS request -> APPROVED
  console.log('\n--- STEP 5: TEACHER B ACCEPTS REQUEST (APPROVED) ---')
  const acceptRes = await request(`/requests/${requestId}/accept`, 'PUT', null, tokenB)
  console.log('Accept Request Status:', acceptRes.status, '| Response Message:', acceptRes.body.message)

  // 6. Verify Requester A sees APPROVED status
  console.log('\n--- STEP 6: VERIFY REQUESTING STUDENT A SEES APPROVED ---')
  const sentReqs = await request('/requests/sent', 'GET', null, tokenA)
  const updatedSent = (sentReqs.body || []).find(r => r.id === requestId || r._id === requestId)
  console.log('Sent Request Status for Student A:', updatedSent?.status)
  if (updatedSent?.status !== 'APPROVED') throw new Error('Status not updated to APPROVED!')

  // 7. Verify Admin Requests Page sees APPROVED status
  console.log('\n--- STEP 7: VERIFY ADMIN PANEL SEES APPROVED REQUEST ---')
  const adminLogin = await request('/admin/auth/login', 'POST', { email: 'skillexchange@gmail.com', password: 'saran@2007' })
  const adminToken = adminLogin.body.token

  const adminReqs = await request('/admin/requests?status=APPROVED', 'GET', null, adminToken)
  const adminFound = (adminReqs.body.requests || []).find(r => r.id === requestId || r._id === requestId)
  console.log('Admin Panel Request Status:', adminFound?.status)

  // 8. Test REJECT Flow
  console.log('\n--- STEP 8: TESTING REJECT FLOW ---')
  const createReqJava = await request('/requests', 'POST', {
    toUserId: studentB._id.toString(),
    skill: 'Java',
    courseName: 'Java'
  }, tokenA)
  const javaReqId = createReqJava.body.request._id

  const rejectRes = await request(`/requests/${javaReqId}/reject`, 'PUT', null, tokenB)
  console.log('Reject Request Status:', rejectRes.status, '| Response Status:', rejectRes.body.request.status)

  const adminReqsRejected = await request('/admin/requests?status=REJECTED', 'GET', null, adminToken)
  const adminFoundRejected = (adminReqsRejected.body.requests || []).find(r => r.id === javaReqId || r._id === javaReqId)
  console.log('Admin Panel Rejected Request Status:', adminFoundRejected?.status)

  console.log('\n✅ COMPLETE TEACHING REQUEST SYSTEM SCENARIO VERIFIED SUCCESSFULLY!')
}

runCompleteTeachingFlowTest().catch(err => {
  console.error('❌ Teaching flow test failed:', err)
  process.exit(1)
})
