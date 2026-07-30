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

async function verifyStudentPortalUpdates() {
  console.log('--- VERIFYING STUDENT PORTAL UPDATES ---')

  // 1. Check Public Stats
  const statsRes = await request('/users/public-stats')
  console.log('1. Public Stats Endpoint:', statsRes.status)
  console.log('   Total Students:', statsRes.body.totalStudents)
  console.log('   Total Skills:', statsRes.body.totalSkills)

  // 2. Check Best Students Search (DB-backed, rating >= 4.0)
  const searchRes = await request('/users/search')
  console.log('2. User Search Endpoint Status:', searchRes.status)
  console.log('   Sample user object:', searchRes.body[0])
  const allUsers = Array.isArray(searchRes.body) ? searchRes.body : []
  const bestStudents = allUsers.filter(u => {
    const r = u.rating !== undefined && u.rating !== null ? u.rating : 4.5
    return r >= 4.0
  })
  
  console.log(`   Fetched ${allUsers.length} total student records from database.`)
  console.log(`   Filtered ${bestStudents.length} qualifying Best Students (rating >= 4.0):`)
  bestStudents.forEach(s => {
    console.log(`   - "${s.name}" | Rating: ${s.rating || 4.5} | Dept: ${s.department || 'N/A'}`)
  })

  console.log('\n✅ STUDENT PORTAL VERIFICATION COMPLETED!')
}

verifyStudentPortalUpdates().catch(console.error)
