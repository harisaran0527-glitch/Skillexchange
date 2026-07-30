const fs = require('fs')
const path = require('path')

console.log('--- SCANNING STUDENT COURSES & SKILLS PAGE & COMPONENTS FOR DARK THEME COMPLIANCE ---')

const filesToCheck = [
  path.join(__dirname, '../frontend/src/pages/CourseSearch.tsx'),
  path.join(__dirname, '../frontend/src/components/CompletedCoursesModal.tsx'),
  path.join(__dirname, '../frontend/src/components/ui/ContextMenu.tsx'),
  path.join(__dirname, '../frontend/src/components/QuestionBankModal.tsx'),
  path.join(__dirname, '../frontend/src/components/BookSessionModal.tsx')
]

let totalViolations = 0

filesToCheck.forEach(file => {
  if (!fs.existsSync(file)) return
  const content = fs.readFileSync(file, 'utf8')
  const basename = path.basename(file)

  console.log(`\nInspecting ${basename}...`)

  // Check for forbidden white background utility classes that turn elements white
  const whiteBgRegex = /class(?:Name)?=["'][^"']*\b(bg-white|bg-slate-50|bg-slate-100|bg-gray-50|bg-gray-100)\b[^"']*["']/g
  const matches = [...content.matchAll(whiteBgRegex)]

  if (matches.length > 0) {
    console.error(`❌ Found ${matches.length} light background violations in ${basename}:`)
    matches.forEach(m => console.error(`   - ${m[0]}`))
    totalViolations += matches.length
  } else {
    console.log(`✅ ${basename} passed! Zero light/white background classes found.`)
  }
})

if (totalViolations === 0) {
  console.log('\n✅ ALL COURSES & SKILLS PAGE COMPONENTS FULLY VERIFIED AS DARK THEME!')
} else {
  console.error(`\n❌ Total violations found: ${totalViolations}`)
  process.exit(1)
}
