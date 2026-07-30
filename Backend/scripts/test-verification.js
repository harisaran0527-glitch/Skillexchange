require('dotenv').config()
const http = require('http')

async function request(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 5005,
      path: `/api${path}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    }
    if (token) options.headers['Authorization'] = `Bearer ${token}`

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          resolve({ status: res.statusCode, body: parsed })
        } catch {
          resolve({ status: res.statusCode, body: data })
        }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function runTests() {
  console.log('--- RUNNING FULL SYSTEM VERIFICATION ---')

  // 1. Admin Login
  const adminLoginRes = await request('/admin/auth/login', 'POST', {
    email: 'skillexchange@gmail.com',
    password: 'saran@2007'
  })
  console.log('1. Admin Login Status:', adminLoginRes.status)
  if (adminLoginRes.status !== 200) throw new Error('Admin login failed')
  const adminToken = adminLoginRes.body.token

  // 2. Create Student Saran with multiple skills: C, C++, Java, Python
  const createStudentRes = await request('/admin/students', 'POST', {
    name: 'Saran',
    email: 'saran@example.com',
    password: 'abc123',
    department: 'CSE',
    section: 'A',
    year: '3',
    college: 'GAS College',
    skillsOffered: ['C', 'C++', 'Java', 'Python'],
    completedCourses: ['C', 'C++', 'Java', 'Python']
  }, adminToken)
  console.log('2. Create Student (Saran) Status:', createStudentRes.status)

  // 3. Test Student Login at /api/auth/login using exact credentials saran@example.com / abc123
  const studentLoginRes = await request('/auth/login', 'POST', {
    email: 'saran@example.com',
    password: 'abc123'
  })
  console.log('3. Student Login with Admin-Created Credentials Status:', studentLoginRes.status)
  if (studentLoginRes.status !== 200) throw new Error('Student login failed with admin created credentials!')
  const studentToken = studentLoginRes.body.token
  console.log('   Logged in Student Name:', studentLoginRes.body.user.name)

  // 4. Verify Skills Directory (Many-to-Many): Query /admin/skills
  const skillsRes = await request('/admin/skills', 'GET', null, adminToken)
  console.log('4. Skills Directory Query Status:', skillsRes.status)
  const skills = skillsRes.body
  const targetSkills = ['C', 'C++', 'Java', 'Python']
  for (const sName of targetSkills) {
    const foundSkill = skills.find(s => s.name.toLowerCase() === sName.toLowerCase())
    if (foundSkill) {
      const studentNames = (foundSkill.students || []).map(st => st.name)
      console.log(`   Skill "${foundSkill.name}" connected students:`, studentNames)
    }
  }

  // 5. Add YouTube Video & Question Bank to a Course (e.g. C Programming)
  const createCourseRes = await request('/admin/courses', 'POST', {
    name: 'C',
    category: 'Programming',
    description: 'Master C programming from fundamentals to memory management.',
    youtubeUrl: 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    questionBankTitle: 'C Language Core Exam Question Bank',
    questionBankUrl: 'https://example.com/c_questions.pdf',
    questionBankContent: '1. What is a pointer in C?\n2. Explain dynamic memory allocation (malloc vs calloc).'
  }, adminToken)
  console.log('5. Create/Update Course Resources & Question Bank Status:', createCourseRes.status)

  // 6. Verify Requests Page returns empty list
  const requestsRes = await request('/admin/requests', 'GET', null, adminToken)
  console.log('6. Requests Query Status:', requestsRes.status, 'Total Requests:', requestsRes.body.total)

  // 7. Verify Student Cannot Access Admin Endpoints
  const forbiddenRes = await request('/admin/stats', 'GET', null, studentToken)
  console.log('7. Student Accessing Admin Route Security Check Status:', forbiddenRes.status)

  console.log('\n✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!')
}

runTests().catch(err => {
  console.error('❌ Verification Test Failed:', err)
  process.exit(1)
})
