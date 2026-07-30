require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const http = require('http')

async function searchApi(queryStr) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(queryStr)
    const options = {
      hostname: '127.0.0.1',
      port: 5005,
      path: `/api/search?q=${encoded}`,
      method: 'GET'
    }

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
    req.end()
  })
}

async function runTests() {
  console.log('--- TESTING COURSE RESOLUTION & RESOURCE MAPPING ---')
  const testQueries = ['C++', 'cpp', 'HTML & CSS', 'html/css', 'Java', 'Python', 'C', 'React', 'SQL', 'JavaScript']

  let allPassed = true

  for (const q of testQueries) {
    const res = await searchApi(q)
    console.log(`\nQuery: "${q}" -> HTTP ${res.status}`)
    const courses = res.body.courses || []
    console.log(`Found ${courses.length} courses:`, courses.map(c => c.name))

    if (courses.length === 0) {
      console.error(`❌ FAILED: Query "${q}" returned NO courses ("Unavailable")!`)
      allPassed = false
    } else {
      courses.forEach(c => {
        const hasVideo = !!c.youtubeUrl
        const hasQb = !!c.questionBankTitle
        console.log(`   - Course: "${c.name}" | Video: ${hasVideo ? '✅' : '❌'} | Question Bank: ${hasQb ? '✅' : '❌'}`)
        if (!hasVideo || !hasQb) allPassed = false
      })
    }
  }

  if (allPassed) {
    console.log('\n✅ ALL COURSES (INCLUDING C++ AND HTML & CSS) LOADED RESOURCES SUCCESSFULLY!')
  } else {
    console.error('\n❌ SOME COURSES STILL HAVE ISSUES!')
    process.exit(1)
  }
}

runTests().catch(err => {
  console.error(err)
  process.exit(1)
})
