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

async function runPersistenceTest() {
  console.log('--- EXHAUSTIVE PERSISTENCE & DATA INTEGRITY TEST ---')

  // 1. Login as Admin
  const adminLoginRes = await request('/admin/auth/login', 'POST', { email: 'skillexchange@gmail.com', password: 'saran@2007' })
  if (adminLoginRes.status !== 200) throw new Error('Admin login failed')
  const token = adminLoginRes.body.token
  console.log('1. Admin Authentication: SUCCESS (200)')

  // 2. Add a new Student (Saran Persistence Test) with C, C++, Java, Python
  const timestamp = Date.now()
  const studentEmail = `saran_persist_${timestamp}@example.com`
  const createStudentRes = await request('/admin/students', 'POST', {
    name: 'Saran Persistence Test',
    email: studentEmail,
    password: 'password123',
    department: 'CSE',
    section: 'A',
    year: '3',
    college: 'AVS ENGINEERING COLLEGE',
    skillsOffered: ['C', 'C++', 'Java', 'Python'],
    completedCourses: ['C', 'C++', 'Java', 'Python']
  }, token)

  console.log('2. Admin Add Student Status:', createStudentRes.status)
  if (createStudentRes.status !== 201) throw new Error('Failed to create student')
  const studentId = createStudentRes.body._id

  // 3. Add a new Course (Rust) with YouTube Video & Question Bank
  const createCourseRes = await request('/admin/courses', 'POST', {
    name: `Rust_${timestamp}`,
    category: 'Programming',
    description: 'Rust Systems Programming & Memory Safety',
    youtubeUrl: 'https://www.youtube.com/watch?v=5C_HPTJg5Ek',
    questionBankTitle: 'Rust Core Exam Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/rust_questions.pdf',
    questionBankContent: '1. What is Ownership and Borrowing in Rust?\n2. Explain Lifetimes and Mutable References.'
  }, token)

  console.log('3. Admin Add Course Status:', createCourseRes.status)
  if (createCourseRes.status !== 201) throw new Error('Failed to create course')
  const courseId = createCourseRes.body._id

  // 4. Verify MongoDB directly to confirm data is written to actual MongoDB collections
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  await mongoose.connect(uri)
  const Course = require('../models/Course')
  const User = require('../models/User')

  const dbStudent = await User.findById(studentId)
  const dbCourse = await Course.findById(courseId)

  console.log('\n--- DIRECT MONGO PERSISTENCE VERIFICATION ---')
  console.log('DB Student Record:', {
    id: dbStudent?._id.toString(),
    name: dbStudent?.name,
    college: dbStudent?.college,
    skillsOffered: dbStudent?.skillsOffered
  })
  console.log('DB Course Record:', {
    id: dbCourse?._id.toString(),
    name: dbCourse?.name,
    youtubeUrl: dbCourse?.youtubeUrl,
    qbTitle: dbCourse?.questionBankTitle
  })

  if (!dbStudent || dbStudent.skillsOffered.length !== 4) throw new Error('Student data mismatch in DB')
  if (!dbCourse || !dbCourse.youtubeUrl || !dbCourse.questionBankTitle) throw new Error('Course data mismatch in DB')

  // 5. Test Explicit Delete: Delete ONLY the Rust course
  console.log('\n--- TESTING EXPLICIT ADMIN DELETE ACTION ---')
  const deleteRes = await request(`/admin/courses/${courseId}`, 'DELETE', null, token)
  console.log('Delete Course Status:', deleteRes.status)

  const deletedCourseCheck = await Course.findById(courseId)
  const studentStillExistsCheck = await User.findById(studentId)

  console.log('Deleted Course in DB after explicit delete:', deletedCourseCheck === null ? 'NULL (Deleted)' : 'STILL EXISTS')
  console.log('Student Record after Course delete:', studentStillExistsCheck ? 'INTACT (Preserved)' : 'DELETED')

  if (deletedCourseCheck !== null) throw new Error('Explicit delete failed to remove course')
  if (!studentStillExistsCheck) throw new Error('Unrelated student record was wrongfully deleted!')

  // Cleanup test student
  await User.findByIdAndDelete(studentId)
  await mongoose.disconnect()

  console.log('\n✅ PERSISTENCE & DATA SAFETY VERIFICATION COMPLETED SUCCESSFULLY!')
}

runPersistenceTest().catch(err => {
  console.error('❌ Persistence test failed:', err)
  process.exit(1)
})
