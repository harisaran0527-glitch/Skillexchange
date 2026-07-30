require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const http = require('http')

async function fetchJson(path, method = 'GET', body = null, token = null) {
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
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
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
  console.log('--- STARTING FULL EXHAUSTIVE COURSE & RESOURCE TEST ---')

  // 1. Test Admin Login to get token
  const adminLoginRes = await fetchJson('/admin/auth/login', 'POST', {
    email: 'skillexchange@gmail.com',
    password: 'saran@2007'
  })
  if (adminLoginRes.status !== 200) throw new Error('Admin login failed')
  const adminToken = adminLoginRes.body.token
  console.log('1. Admin Auth Login: SUCCESS (200)')

  // 2. Test GET /api/admin/courses
  const adminCoursesRes = await fetchJson('/admin/courses', 'GET', null, adminToken)
  console.log('2. GET /api/admin/courses Status:', adminCoursesRes.status)
  if (adminCoursesRes.status !== 200) throw new Error('GET /api/admin/courses failed')

  const adminCourses = adminCoursesRes.body
  console.log(`   Fetched ${adminCourses.length} courses from Admin API.`)

  // Check C++ and HTML & CSS specifically in Admin Courses list
  const cppAdmin = adminCourses.find(c => c.name === 'C++')
  const htmlCssAdmin = adminCourses.find(c => c.name === 'HTML & CSS')

  console.log('\n--- ADMIN PORTAL VERIFICATION ---')
  console.log('C++ Admin Record:', {
    id: cppAdmin?._id || cppAdmin?.id,
    name: cppAdmin?.name,
    hasVideo: !!cppAdmin?.youtubeUrl,
    hasQbTitle: !!cppAdmin?.questionBankTitle
  })
  console.log('HTML & CSS Admin Record:', {
    id: htmlCssAdmin?._id || htmlCssAdmin?.id,
    name: htmlCssAdmin?.name,
    hasVideo: !!htmlCssAdmin?.youtubeUrl,
    hasQbTitle: !!htmlCssAdmin?.questionBankTitle
  })

  if (!cppAdmin || !cppAdmin.youtubeUrl || !cppAdmin.questionBankTitle) {
    throw new Error('C++ Admin course record is missing or incomplete!')
  }
  if (!htmlCssAdmin || !htmlCssAdmin.youtubeUrl || !htmlCssAdmin.questionBankTitle) {
    throw new Error('HTML & CSS Admin course record is missing or incomplete!')
  }

  // 3. Test GET /api/courses (Public / Student Course API)
  console.log('\n--- STUDENT PORTAL VERIFICATION ---')
  const studentCoursesRes = await fetchJson('/courses', 'GET')
  console.log('3. GET /api/courses Status:', studentCoursesRes.status)
  const studentCourses = studentCoursesRes.body

  console.log('Total Student Courses Loaded:', studentCourses.length)
  studentCourses.forEach(c => {
    console.log(`- Course [${c._id}]: "${c.name}" | Video: ${c.youtubeUrl ? 'YES' : 'NO'} | QB: ${c.questionBankTitle ? 'YES' : 'NO'}`)
  })

  // 4. Test Query Resolution for C++, cpp, HTML & CSS, html/css
  console.log('\n--- SEARCH & QUERY RESOLUTION VERIFICATION ---')
  const testQueries = ['C++', 'cpp', 'HTML & CSS', 'html/css']
  for (const q of testQueries) {
    const sRes = await fetchJson(`/search?q=${encodeURIComponent(q)}`)
    const found = sRes.body.courses || []
    console.log(`Query "${q}" -> Returned ${found.length} course(s):`, found.map(f => f.name))
    if (found.length === 0) throw new Error(`Query "${q}" returned no course records!`)
  }

  console.log('\n✅ ALL VERIFICATIONS COMPLETED! C++ AND HTML & CSS ARE 100% WORKING!')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
