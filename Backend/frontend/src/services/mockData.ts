export interface MockUser {
  id: string
  name: string
  email: string
  department: string
  year: string
  skillsOffered: string[]
  completedCourses: string[]
}

export const mockUsers: MockUser[] = [
  {
    id: '1',
    name: 'Saran Kumar',
    email: 'saran@example.com',
    department: 'CSE',
    year: '3',
    skillsOffered: ['React', 'TypeScript', 'Node.js'],
    completedCourses: ['Web Dev', 'Databases']
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    department: 'IT',
    year: '4',
    skillsOffered: ['Python', 'Machine Learning'],
    completedCourses: ['AI Fundamentals', 'Data Science']
  },
  {
    id: '3',
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    department: 'AIML',
    year: '2',
    skillsOffered: ['C++', 'Data Structures'],
    completedCourses: ['Algorithms']
  }
]

export const stats = {
  totalStudents: 342,
  activeThisWeek: 128,
  matchesMade: 412,
  skillsListed: 87
}
