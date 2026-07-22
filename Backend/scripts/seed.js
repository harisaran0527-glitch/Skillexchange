require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Admin = require('../models/Admin')
const User = require('../models/User')
const Skill = require('../models/Skill')
const LearningRequest = require('../models/LearningRequest')

function randomDate(monthsBack) {
  const d = new Date()
  d.setMonth(d.getMonth() - Math.floor(Math.random() * monthsBack))
  d.setDate(Math.floor(Math.random() * 28) + 1)
  return d
}

async function runSeed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Error: MongoDB URI not configured for seeding. Please set MONGODB_URI or MONGO_URI.')
    process.exit(1)
  }
  console.log('Connecting to MongoDB database...')
  await mongoose.connect(uri)
  console.log('Connected successfully. Seeding data via Mongoose...')

  // ── Seed Admin ──────────────────────────────────────────────────
  const adminExists = await Admin.findOne({ email: 'admin@skillswap.com' })
  if (!adminExists) {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash('Admin@123', salt)
    const admin = new Admin({
      name: 'SkillSwap Admin',
      email: 'admin@skillswap.com',
      password: hashed,
      role: 'superadmin'
    })
    await admin.save()
    console.log('✅ Admin created: admin@skillswap.com / Admin@123')
  } else {
    console.log('ℹ️  Admin already exists')
  }

  // ── Seed Demo Students ──────────────────────────────────────────
  const existingCount = await User.countDocuments()
  if (existingCount < 5) {
    const salt = await bcrypt.genSalt(10)
    const hashed = await bcrypt.hash('demo1234', salt)

    const demoStudents = [
      { name: 'Asha Ramesh',    email: 'asha@demo.com',    department: 'CSE',   section: 'A', year: 'Third Year',  college: 'GAS College', skillsOffered: ['React','TypeScript','CSS','HTML'], completedCourses: ['Web Development','UI Frameworks'] },
      { name: 'Vikram Patel',   email: 'vikram@demo.com',  department: 'EEE',   section: 'A', year: 'Second Year', college: 'GAS College', skillsOffered: ['Arduino','Embedded Systems','C++'], completedCourses: ['IoT Basics','Microcontrollers'] },
      { name: 'Priya Menon',    email: 'priya@demo.com',   department: 'AIML',  section: 'A', year: 'Fourth Year', college: 'GAS College', skillsOffered: ['Figma','UX Design','Adobe XD'], completedCourses: ['Design Thinking','Prototyping'] },
      { name: 'Rahul Kumar',    email: 'rahul@demo.com',   department: 'AI&DS', section: 'B', year: 'First Year',  college: 'GAS College', skillsOffered: ['Python','Machine Learning','Data Science'], completedCourses: ['Python Fundamentals','Statistics'] },
      { name: 'Sneha Iyer',     email: 'sneha@demo.com',   department: 'IT',    section: 'A', year: 'Third Year',  college: 'GAS College', skillsOffered: ['Statistics','R Language','MATLAB','LaTeX'], completedCourses: ['Data Analytics','R Programming'] },
      { name: 'Arjun Singh',    email: 'arjun@demo.com',   department: 'MECH',  section: 'A', year: 'Second Year', college: 'GAS College', skillsOffered: ['AutoCAD','SolidWorks','MATLAB'], completedCourses: ['CAD Design','Mechanical Drawing'] },
      { name: 'Kavya Nair',     email: 'kavya@demo.com',   department: 'CSE',   section: 'B', year: 'Fourth Year', college: 'GAS College', skillsOffered: ['Java','Spring Boot','SQL','Git'], completedCourses: ['Backend Development','Database Systems'] },
      { name: 'Deepak Sharma',  email: 'deepak@demo.com',  department: 'EEE',   section: 'A', year: 'Third Year',  college: 'GAS College', skillsOffered: ['VLSI','PCB Design','Embedded Systems'], completedCourses: ['Circuit Design','VLSI Fundamentals'] },
      { name: 'Ananya Krishna', email: 'ananya@demo.com',  department: 'AI&DS', section: 'C', year: 'Second Year', college: 'GAS College', skillsOffered: ['LaTeX','MATLAB','Statistics'], completedCourses: ['Research Methods','Statistical Analysis'] },
      { name: 'Rohan Verma',    email: 'rohan@demo.com',   department: 'CSE',   section: 'C', year: 'Third Year',  college: 'GAS College', skillsOffered: ['Node.js','Express','MongoDB','SQL'], completedCourses: ['Full Stack Development','API Design'] },
      { name: 'Meera Pillai',   email: 'meera@demo.com',   department: 'CIVIL', section: 'A', year: 'Second Year', college: 'GAS College', skillsOffered: ['AutoCAD','Civil 3D'], completedCourses: ['Structural Analysis','Civil CAD'] },
      { name: 'Arun Babu',      email: 'arun@demo.com',    department: 'IT',    section: 'B', year: 'First Year',  college: 'GAS College', skillsOffered: ['HTML','CSS','JavaScript'], completedCourses: ['Intro to Web Dev'] },
      { name: 'Divya Sree',     email: 'divya@demo.com',   department: 'AI&DS', section: 'A', year: 'Fourth Year', college: 'GAS College', skillsOffered: ['Signal Processing','MATLAB','Python'], completedCourses: ['Digital Signal Processing','ML Basics'] },
      { name: 'Kiran Reddy',    email: 'kiran@demo.com',   department: 'AIML',  section: 'B', year: 'Third Year',  college: 'GAS College', skillsOffered: ['Statistics','Excel','SQL'], completedCourses: ['Business Analytics','Data Visualization'] },
      { name: 'Nisha Thomas',   email: 'nisha@demo.com',   department: 'BME',   section: 'A', year: 'Third Year',  college: 'GAS College', skillsOffered: ['Figma','Adobe XD','CSS'], completedCourses: ['UI/UX Design','Graphic Design'] },
    ]

    for (let i = 0; i < demoStudents.length; i++) {
      const monthsBack = Math.floor((i / demoStudents.length) * 6)
      const d = randomDate(monthsBack + 1)
      const user = new User({
        ...demoStudents[i],
        password: hashed,
        createdAt: d,
        updatedAt: d
      })
      await user.save()
    }
    console.log(`✅ Created ${demoStudents.length} demo students`)

    // ── Seed Demo Requests ──────────────────────────────────────────
    const users = await User.find().select('_id name department section skillsOffered completedCourses')
    const statuses = ['Pending', 'Pending', 'Pending', 'Accepted', 'Accepted', 'Rejected']
    
    let createdReqCount = 0
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < Math.min(i + 4, users.length); j++) {
        const u1 = users[i], u2 = users[j]
        // Match: u1 wants to learn something u2 has completed
        const common = (u2.completedCourses || []).filter(c => (u1.skillsOffered || []).length > 0)
        if (common.length > 0) {
          const status = statuses[Math.floor(Math.random() * statuses.length)]
          const d = randomDate(5)
          const request = new LearningRequest({
            studentId: u1._id.toString(),
            tutorId: u2._id.toString(),
            studentName: u1.name,
            tutorName: u2.name,
            courseName: common[0],
            department: u1.department,
            section: u1.section,
            status,
            requestDate: d.toLocaleDateString(),
            requestTime: d.toLocaleTimeString(),
            message: `Hi! I'd love to learn ${common[0]} from you.`,
            createdAt: d,
            updatedAt: d
          })
          await request.save()
          createdReqCount++
        }
      }
    }
    console.log(`✅ Created ${createdReqCount} demo learning requests`)

    // ── Seed global skills dropdown list ─────────────────────────────
    const uniqueSkills = new Set()
    demoStudents.forEach(s => {
      s.skillsOffered.forEach(sk => uniqueSkills.add(sk))
    })

    for (const skillName of uniqueSkills) {
      const existing = await Skill.findOne({ name: { $regex: new RegExp(`^${skillName}$`, 'i') } })
      if (!existing) {
        await new Skill({ name: skillName }).save()
      }
    }
    console.log(`✅ Populated global skills database with ${uniqueSkills.size} unique skills`)

  } else {
    console.log(`ℹ️  ${existingCount} students already exist — skipping student seed`)
  }

  console.log('\n🚀 Seed complete!\n')
  console.log('Admin Login: admin@skillswap.com / Admin@123')
  console.log('Demo Student: asha@demo.com / demo1234')
}

if (require.main === module) {
  runSeed()
    .catch(err => { console.error(err); process.exit(1) })
    .finally(async () => { await mongoose.disconnect() })
} else {
  module.exports = runSeed
}

