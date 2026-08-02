const path = require('path')
require('dotenv').config()
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
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
  console.log('--- STARTING SECURE EMAIL TEACHING REQUEST SYSTEM FLOW TEST ---')

  const { connectMongoDB } = require('../config/mongoDb')
  await connectMongoDB()
  const User = require('../models/User')
  const LearningRequest = require('../models/LearningRequest')

  // Setup Student A (Requester: Saran) and Student B (Teacher: Hari/Yukeesh)
  let studentA = await User.findOne({ isSuspended: false })
  let studentB = await User.findOne({ _id: { $ne: studentA._id }, isSuspended: false })

  if (!studentB) {
    const salt = await require('bcryptjs').genSalt(10)
    const hashed = await require('bcryptjs').hash('password123', salt)
    studentB = new User({
      name: 'Hari K',
      email: 'hari.ad25@avsenggcollege.ac.in',
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

  // ASSERT: Student A MUST NOT appear in eligible teachers list
  const isSelfInTeachers = cppTeachers.some(t => (t.id || t._id).toString() === studentA._id.toString() || t.name === studentA.name)
  if (isSelfInTeachers) {
    throw new Error(`TEST FAILED: Requesting student "${studentA.name}" appeared in their own eligible teacher search results!`)
  }
  console.log('   ✅ CONFIRMED: Requesting student is excluded from eligible teachers search results!')

  // 3. Student A creates request for Student B to teach C++
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

  // 4. Verify portal accept/reject calls are BLOCKED
  console.log('\n--- STEP 4: VERIFY STUDENT PORTAL & ADMIN PORTAL ACTION BUTTONS ARE BLOCKED ---')
  const loginB = await request('/auth/login', 'POST', {
    email: studentB.email,
    password: 'password123'
  })
  const tokenB = loginB.body.token

  const portalAcceptAttempt = await request(`/requests/${requestId}/accept`, 'PUT', null, tokenB)
  console.log('Portal Accept Attempt Status:', portalAcceptAttempt.status, '| Message:', portalAcceptAttempt.body.message)
  if (portalAcceptAttempt.status !== 403) {
    throw new Error('Student Portal accept action was not blocked!')
  }
  console.log('   ✅ CONFIRMED: Teacher Student Portal cannot accept requests directly!')

  const adminLogin = await request('/admin/auth/login', 'POST', { email: 'skillexchange@gmail.com', password: 'saran@2007' })
  const adminToken = adminLogin.body.token

  const adminAcceptAttempt = await request(`/admin/requests/${requestId}/approve`, 'PUT', null, adminToken)
  console.log('Admin Accept Attempt Status:', adminAcceptAttempt.status, '| Message:', adminAcceptAttempt.body.message)
  if (adminAcceptAttempt.status !== 403) {
    throw new Error('Admin accept action was not blocked!')
  }
  console.log('   ✅ CONFIRMED: Admin Panel cannot approve requests!')

  // 5. Test Email Action: OK (Approve)
  console.log('\n--- STEP 5: SIMULATING TEACHER CLICKING [OK] BUTTON IN EMAIL ---')
  // Retrieve raw token via hashed lookup in test script
  const reqDoc = await LearningRequest.findById(requestId)
  const hashedInDb = reqDoc.actionTokenHash

  // We test email action with a sample valid raw token by checking token match logic or sending request
  // Let's create a known raw token test request directly in DB to test emailAction endpoint
  const rawTokenTest = require('crypto').randomBytes(32).toString('hex')
  const hashedTest = require('crypto').createHash('sha256').update(rawTokenTest).digest('hex')
  
  reqDoc.actionTokenHash = hashedTest
  await reqDoc.save()

  // Click OK in email
  const okClickRes = await request(`/requests/email-action?token=${rawTokenTest}&action=approve`, 'GET')
  console.log('Email OK Click Status Code:', okClickRes.status)
  if (typeof okClickRes.body === 'string' && okClickRes.body.includes('Teaching request approved successfully.')) {
    console.log('   ✅ CONFIRMED: Email OK click returned mobile-friendly confirmation: "Teaching request approved successfully."')
  } else {
    throw new Error(`Email OK click failed! Response: ${JSON.stringify(okClickRes.body)}`)
  }

  // Verify status in DB
  const updatedReqDoc = await LearningRequest.findById(requestId)
  console.log('Updated Request Status in DB:', updatedReqDoc.status)
  if (updatedReqDoc.status !== 'APPROVED') {
    throw new Error('Request status in DB was not updated to APPROVED!')
  }

  // 6. Test Repeat Click
  console.log('\n--- STEP 6: VERIFY REPEAT OR CHANGED EMAIL CLICK IS BLOCKED ---')
  const repeatClickRes = await request(`/requests/email-action?token=${rawTokenTest}&action=approve`, 'GET')
  console.log('Repeat Click Status Code:', repeatClickRes.status)
  if (typeof repeatClickRes.body === 'string' && repeatClickRes.body.includes('This request has already been answered.')) {
    console.log('   ✅ CONFIRMED: Repeat click returned: "This request has already been answered."')
  } else {
    throw new Error(`Repeat click test failed! Response: ${JSON.stringify(repeatClickRes.body)}`)
  }

  // 7. Verify Requester Saran and Admin Panel see APPROVED status
  console.log('\n--- STEP 7: VERIFY REQUESTER & ADMIN PANEL SEE APPROVED STATUS ---')
  const sentReqs = await request('/requests/sent', 'GET', null, tokenA)
  const updatedSent = (sentReqs.body || []).find(r => r.id === requestId || r._id === requestId)
  console.log('Sent Request Status for Requester:', updatedSent?.status)
  if (updatedSent?.status !== 'APPROVED') throw new Error('Requester does not see APPROVED status!')

  const adminReqs = await request('/admin/requests?status=APPROVED', 'GET', null, adminToken)
  const adminFound = (adminReqs.body.requests || []).find(r => r.id === requestId || r._id === requestId)
  console.log('Admin Panel Request Status:', adminFound?.status)
  if (adminFound?.status !== 'APPROVED') throw new Error('Admin Panel does not see APPROVED status!')

  // 8. Test REJECT Flow
  console.log('\n--- STEP 8: TESTING CANCEL (REJECT) EMAIL FLOW ---')
  const createReqJava = await request('/requests', 'POST', {
    toUserId: studentB._id.toString(),
    skill: 'Java',
    courseName: 'Java'
  }, tokenA)
  const javaReqId = createReqJava.body.request._id

  const rawTokenReject = require('crypto').randomBytes(32).toString('hex')
  const hashedReject = require('crypto').createHash('sha256').update(rawTokenReject).digest('hex')
  
  const javaReqDoc = await LearningRequest.findById(javaReqId)
  javaReqDoc.actionTokenHash = hashedReject
  await javaReqDoc.save()

  // Click CANCEL in email
  const cancelClickRes = await request(`/requests/email-action?token=${rawTokenReject}&action=reject`, 'GET')
  console.log('Email CANCEL Click Status Code:', cancelClickRes.status)
  if (typeof cancelClickRes.body === 'string' && cancelClickRes.body.includes('Teaching request rejected successfully.')) {
    console.log('   ✅ CONFIRMED: Email CANCEL click returned: "Teaching request rejected successfully."')
  } else {
    throw new Error(`Email CANCEL click failed! Response: ${JSON.stringify(cancelClickRes.body)}`)
  }

  const updatedJavaDoc = await LearningRequest.findById(javaReqId)
  console.log('Java Request Status in DB:', updatedJavaDoc.status)
  if (updatedJavaDoc.status !== 'REJECTED') {
    throw new Error('Java request status was not updated to REJECTED!')
  }

  await mongoose.disconnect()
  console.log('\n✅ SECURE EMAIL TEACHING REQUEST SYSTEM SCENARIO VERIFIED SUCCESSFULLY!')
}

runCompleteTeachingFlowTest().catch(err => {
  console.error('❌ Teaching flow test failed:', err)
  process.exit(1)
})
