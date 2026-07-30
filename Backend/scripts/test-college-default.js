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

async function testDefaultCollege() {
  console.log('--- TESTING DEFAULT COLLEGE SAVE ---')
  const adminLoginRes = await request('/admin/auth/login', 'POST', { email: 'skillexchange@gmail.com', password: 'saran@2007' })
  const token = adminLoginRes.body.token

  const studentData = {
    name: 'Test Student AVS',
    email: `avstest_${Date.now()}@example.com`,
    password: 'password123',
    department: 'CSE',
    section: 'A',
    year: '2',
    college: 'AVS ENGINEERING COLLEGE'
  }

  const res = await request('/admin/students', 'POST', studentData, token)
  console.log('Create Student API Status:', res.status)
  console.log('Saved Student College:', res.body.college)

  if (res.status === 201 && res.body.college === 'AVS ENGINEERING COLLEGE') {
    console.log('✅ DEFAULT COLLEGE PRESET TEST PASSED SUCCESSFULLY!')
  } else {
    console.error('❌ DEFAULT COLLEGE TEST FAILED')
    process.exit(1)
  }
}

testDefaultCollege().catch(console.error)
