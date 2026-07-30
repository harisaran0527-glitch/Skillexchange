require('dotenv').config()
require('dns').setServers(['8.8.8.8', '1.1.1.1'])
const mongoose = require('mongoose')
const Course = require('../models/Course')
const Skill = require('../models/Skill')

const MASTER_COURSES = [
  {
    name: 'C',
    category: 'Programming',
    icon: '⚙️',
    description: 'Master C programming, pointers, structures, and low-level memory management.',
    youtubeUrl: 'https://www.youtube.com/watch?v=KJgsSFOSQv0',
    questionBankTitle: 'C Language Core Exam Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/c_question_bank.pdf',
    questionBankContent: '1. What is a pointer in C and how is memory allocated?\n2. Explain the difference between malloc(), calloc(), realloc(), and free().\n3. What is a structure and how does it differ from a union?\n4. Write a C program to reverse a linked list.'
  },
  {
    name: 'C++',
    category: 'Programming',
    icon: '🔧',
    description: 'Learn Object-Oriented Programming (OOP), STL, templates, and systems programming in C++.',
    youtubeUrl: 'https://www.youtube.com/watch?v=vLnPwxZdW4w',
    questionBankTitle: 'C++ OOP & STL Exam Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/cpp_question_bank.pdf',
    questionBankContent: '1. Explain Inheritance, Encapsulation, Polymorphism, and Abstraction.\n2. What is a virtual function and pure virtual function?\n3. How do std::vector and std::map work in STL?\n4. What is RAII (Resource Acquisition Is Initialization)?'
  },
  {
    name: 'Java',
    category: 'Programming',
    icon: '☕',
    description: 'Core Java, JVM architecture, multithreading, collections framework, and enterprise concepts.',
    youtubeUrl: 'https://www.youtube.com/watch?v=eIrMbAQSU34',
    questionBankTitle: 'Java Enterprise & Core Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/java_question_bank.pdf',
    questionBankContent: '1. Differentiate between JDK, JRE, and JVM.\n2. Why is String immutable in Java?\n3. How does Garbage Collection work in Java?\n4. Explain HashMap internal implementation (Buckets & Hash values).'
  },
  {
    name: 'Python',
    category: 'Programming',
    icon: '🐍',
    description: 'Python scripting, data structures, OOP, file handling, and automated data processing.',
    youtubeUrl: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc',
    questionBankTitle: 'Python Data Science & Core Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/python_question_bank.pdf',
    questionBankContent: '1. What are list comprehensions, tuple unpacking, and dictionary comprehensions?\n2. Explain decorators and generator functions with yield.\n3. What is GIL (Global Interpreter Lock) in Python?\n4. How to handle exceptions using try-except-finally?'
  },
  {
    name: 'JavaScript',
    category: 'Web Development',
    icon: '🟡',
    description: 'Modern ES6+ JavaScript, DOM manipulation, promises, async/await, and event loops.',
    youtubeUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
    questionBankTitle: 'JavaScript ES6+ & Async Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/javascript_question_bank.pdf',
    questionBankContent: '1. What is closure and how does lexical scoping work?\n2. Explain Event Loop, Call Stack, Microtask Queue, and Macrotask Queue.\n3. Compare Promises and Async/Await with error handling.'
  },
  {
    name: 'React',
    category: 'Web Development',
    icon: '⚛️',
    description: 'Component architecture, state, props, hooks (useState, useEffect, useMemo), and React Router.',
    youtubeUrl: 'https://www.youtube.com/watch?v=SqcY0GlETPk',
    questionBankTitle: 'React Hooks & State Architecture Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/react_question_bank.pdf',
    questionBankContent: '1. How does Virtual DOM and Reconciliation algorithm work?\n2. What is the difference between useEffect and useLayoutEffect?\n3. Explain state management using Context API vs Redux Toolkit.'
  },
  {
    name: 'SQL',
    category: 'Database',
    icon: '🗄️',
    description: 'Relational database design, SQL queries, JOINs, indexing, normalization, and ACID properties.',
    youtubeUrl: 'https://www.youtube.com/watch?v=HXV3zeQKqGY',
    questionBankTitle: 'SQL Database & Query Optimization Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/sql_question_bank.pdf',
    questionBankContent: '1. Differentiate between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN.\n2. What are ACID properties in database management systems?\n3. Explain 1NF, 2NF, 3NF, and BCNF normalization forms.'
  },
  {
    name: 'HTML & CSS',
    category: 'Web Development',
    icon: '🎨',
    description: 'Semantic HTML5 structure, responsive layout design using CSS Flexbox, Grid, and animations.',
    youtubeUrl: 'https://www.youtube.com/watch?v=G3e-cpL7ofc',
    questionBankTitle: 'HTML5 & Responsive CSS Question Bank',
    questionBankUrl: 'https://raw.githubusercontent.com/harisaran0527-glitch/Skillexchange/main/question-banks/html_css_question_bank.pdf',
    questionBankContent: '1. What are HTML5 semantic tags and why do they improve SEO?\n2. Compare CSS Flexbox vs CSS Grid layout systems.\n3. How do media queries create fluid responsive layouts?'
  }
]

async function seedCourses() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('MongoDB URI not configured.')
    process.exit(1)
  }
  await mongoose.connect(uri)
  console.log('Connected to MongoDB. Seeding course resources...')

  for (const cData of MASTER_COURSES) {
    await Course.findOneAndUpdate(
      { name: cData.name },
      { $set: cData },
      { upsert: true, new: true }
    )

    // Ensure skill entry exists as well
    await Skill.findOneAndUpdate(
      { name: cData.name },
      { $setOnInsert: { name: cData.name } },
      { upsert: true }
    )
  }

  console.log(`Successfully seeded ${MASTER_COURSES.length} courses with Learning Videos & Question Banks!`)
  await mongoose.disconnect()
}

seedCourses().catch(err => {
  console.error(err)
  process.exit(1)
})
