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

async function testAdminRatingFeature() {
  console.log('--- TESTING ADMIN COURSE RATING & OVERALL RATING CALCULATION ---')

  // 1. Admin Login
  const adminLoginRes = await request('/admin/auth/login', 'POST', {
    email: 'skillexchange@gmail.com',
    password: 'saran@2007'
  })
  if (adminLoginRes.status !== 200) throw new Error('Admin login failed')
  const token = adminLoginRes.body.token
  console.log('1. Admin Login: SUCCESS (200)')

  // 2. Fetch or Create Test Student with completed courses: C, Java, Python
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  await mongoose.connect(uri)
  const User = require('../models/User')

  let student = await User.findOne({ email: 'saran.ad25@avsenggcollege.ac.in' })
  if (!student) {
    student = await User.findOne({ isSuspended: false })
  }
  student.completedCourses = ['C', 'Java', 'Python']
  await student.save()
  const studentId = student._id.toString()
  await mongoose.disconnect()

  console.log(`2. Test Student: "${student.name}" (ID: ${studentId})`)
  console.log('   Completed Courses:', student.completedCourses)

  // 3. Assign Ratings to Completed Courses
  console.log('\n--- ASSIGNING RATINGS VIA ADMIN API ---')

  // C -> 4.2
  const rate1 = await request(`/admin/students/${studentId}/rate-course`, 'PUT', { courseName: 'C', rating: 4.2 }, token)
  console.log('Rated C -> 4.2 | Response Status:', rate1.status, '| Overall Rating:', rate1.body.rating)

  // Java -> 4.5
  const rate2 = await request(`/admin/students/${studentId}/rate-course`, 'PUT', { courseName: 'Java', rating: 4.5 }, token)
  console.log('Rated Java -> 4.5 | Response Status:', rate2.status, '| Overall Rating:', rate2.body.rating)

  // Python -> 4.0
  const rate3 = await request(`/admin/students/${studentId}/rate-course`, 'PUT', { courseName: 'Python', rating: 4.0 }, token)
  console.log('Rated Python -> 4.0 | Response Status:', rate3.status, '| Overall Rating:', rate3.body.rating)

  // Expected Overall Average = (4.2 + 4.5 + 4.0) / 3 = 4.2333... -> 4.2
  const finalRating = rate3.body.rating
  console.log(`\nCalculated Student Overall Rating in DB: ${finalRating}`)
  if (Math.abs(finalRating - 4.2) > 0.1) throw new Error('Overall rating calculation mismatch!')

  // 4. Test Rule: Attempting to rate an ongoing/uncompleted course must be rejected with HTTP 400!
  console.log('\n--- TESTING RULE: RATING UNCOMPLETED COURSE ---')
  const invalidRate = await request(`/admin/students/${studentId}/rate-course`, 'PUT', { courseName: 'Rust', rating: 4.8 }, token)
  console.log('Rate Uncompleted Course Status:', invalidRate.status, '| Message:', invalidRate.body.message)

  if (invalidRate.status !== 400) throw new Error('Rule failure: Uncompleted course rating was not rejected!')
  console.log('✅ RULE VERIFIED: Rating uncompleted course is strictly blocked!')

  // 5. Verify Student Portal Best Students Query
  console.log('\n--- VERIFYING STUDENT PORTAL BEST STUDENTS FETCH ---')
  const searchRes = await request('/users/search')
  const bestStudents = (searchRes.body || []).filter(u => (u.rating || 0) >= 4.0)
  console.log(`Best Students Qualifying (rating >= 4.0): ${bestStudents.length} student(s)`)
  bestStudents.forEach(s => {
    console.log(`- "${s.name}" | Overall Rating: ${s.rating} | Course Ratings:`, s.courseRatings)
  })

  console.log('\n✅ ALL ADMIN RATING & OVERALL RATING TESTS PASSED SUCCESSFULLY!')
}

testAdminRatingFeature().catch(err => {
  console.error('❌ Admin rating test failed:', err)
  process.exit(1)
})
