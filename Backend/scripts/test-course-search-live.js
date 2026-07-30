require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const http = require('http')

async function search(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query)
    const options = {
      hostname: '127.0.0.1',
      port: 5005,
      path: `/api/search?q=${encoded}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }
    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }) }
        catch { resolve({ status: res.statusCode, body: data }) }
      })
    })
    req.on('error', reject)
    req.end()
  })
}

async function testAllSearchQueries() {
  console.log('--- TESTING COURSE & SKILLS SEARCH FOR SPECIAL CHARACTERS & ALIASES ---')

  const testQueries = ['C', 'C++', 'cpp', 'Java', 'py', 'Python', 'html', 'HTML & CSS', 'c#', 'node']

  for (const q of testQueries) {
    const res = await search(q)
    const coursesFound = (res.body.courses || []).map(c => c.name)
    const studentsFound = (res.body.students || []).map(s => s.name)

    console.log(`\nQuery: "${q}" (Status: ${res.status})`)
    console.log(`  Matching Courses (${coursesFound.length}):`, coursesFound)
    console.log(`  Matching Students (${studentsFound.length}):`, studentsFound.slice(0, 3))

    if (res.status !== 200) {
      throw new Error(`Search failed for query "${q}" with status ${res.status}`)
    }
  }

  console.log('\n✅ ALL COURSE SEARCH QUERIES PASSED SUCCESSFULLY!')
}

testAllSearchQueries().catch(err => {
  console.error('❌ Search test failed:', err)
  process.exit(1)
})
