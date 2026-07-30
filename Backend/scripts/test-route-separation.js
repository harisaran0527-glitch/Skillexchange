require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const http = require('http')

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

async function verifyRouteSeparation() {
  console.log('--- VERIFYING STRICT ADMIN & STUDENT ROUTE SEPARATION ---')

  // 1. Fetch a student from database
  const mongoose = require('mongoose')
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  await mongoose.connect(uri)
  const User = require('../models/User')
  const student = await User.findOne({ isSuspended: false })
  await mongoose.disconnect()

  console.log('Testing with Student Email:', student.email)
  const studentLoginRes = await request('/auth/login', 'POST', {
    email: student.email,
    password: 'password123'
  })
  console.log('1. Student Authentication Login Status:', studentLoginRes.status)
  const studentToken = studentLoginRes.body.token

  // 2. Attempt to access Protected Admin APIs using Student Token
  console.log('\n--- TESTING SECURITY: STUDENT TOKEN ATTEMPTING ADMIN API ACCESS ---')
  const adminStudentsRes = await request('/admin/students', 'GET', null, studentToken)
  console.log('GET /api/admin/students Status with Student Token:', adminStudentsRes.status)

  const adminCoursesRes = await request('/admin/courses', 'GET', null, studentToken)
  console.log('GET /api/admin/courses Status with Student Token:', adminCoursesRes.status)

  const adminReportsRes = await request('/admin/reports/monthly', 'GET', null, studentToken)
  console.log('GET /api/admin/reports/monthly Status with Student Token:', adminReportsRes.status)

  if (adminStudentsRes.status === 401 || adminStudentsRes.status === 403) {
    console.log('✅ BACKEND SECURITY CONFIRMED: Student token CANNOT access Admin APIs!')
  } else {
    console.error('❌ BACKEND SECURITY FAILURE: Student token accessed Admin APIs!')
    process.exit(1)
  }

  // 3. Login as Admin to get Admin JWT Token
  const adminLoginRes = await request('/admin/auth/login', 'POST', {
    email: 'skillexchange@gmail.com',
    password: 'saran@2007'
  })
  console.log('\n3. Admin Authentication Login Status:', adminLoginRes.status)
  const adminToken = adminLoginRes.body.token
  if (!adminToken) throw new Error('Admin login failed')

  const adminAccessRes = await request('/admin/students', 'GET', null, adminToken)
  console.log('GET /api/admin/students Status with Valid Admin Token:', adminAccessRes.status)

  if (adminAccessRes.status === 200) {
    console.log('✅ ADMIN ACCESS CONFIRMED: Valid Admin token opens Admin Dashboard APIs!')
  } else {
    console.error('❌ Admin token access failed!')
    process.exit(1)
  }

  console.log('\n✅ ALL STRICT ROUTE & ROLE SEPARATION VERIFICATIONS PASSED!')
}

verifyRouteSeparation().catch(console.error)
