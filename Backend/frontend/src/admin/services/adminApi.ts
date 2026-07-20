// Admin API service — uses ADMIN token from localStorage
// Completely separate from student api.ts

const ADMIN_TOKEN_KEY = 'skillswap_admin_token'
const ADMIN_USER_KEY  = 'skillswap_admin_user'

export function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) }
export function getAdminUser() {
  const s = localStorage.getItem(ADMIN_USER_KEY)
  return s ? JSON.parse(s) : null
}
export function setAdminSession(token: string, admin: AdminUser) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin))
}
export function clearAdminSession() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_USER_KEY)
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken()
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string,string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`/api/admin${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Admin request failed')
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

// ── Types ─────────────────────────────────────────────
export interface AdminUser { id: string; name: string; email: string; role: string }

export interface Student {
  _id: string
  name: string
  email: string
  department?: string
  section?: string
  year?: string
  college?: string
  profileImage?: string
  skillsOffered: string[]
  completedCourses: string[]
  certificates: string[]
  portfolioLinks: string[]
  socialLinks: string[]
  availability: string
  isSuspended: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminStats {
  totalStudents: number; activeStudents: number; inactiveStudents: number
  totalSkills: number; totalRequests: number; pendingRequests: number
  approvedRequests: number; rejectedRequests: number
  totalDepartments: number; totalMessages: number
}

export interface ChartData {
  registrationsByMonth: { month: string; count: number }[]
  departmentDistribution: { name: string; value: number }[]
  popularSkills: { skill: string; count: number }[]
  skillsDistribution: { name: string; value: number }[]
  requestStatus: { status: string; count: number }[]
  activeVsInactive: { name: string; value: number }[]
}

export interface SkillStat {
  name: string; offered: number; total: number
}

export interface LearningRequest {
  _id: string; skill: string; message: string; status: string; createdAt: string
  fromUser: { _id: string; name: string; email: string; department: string }
  toUser: { _id: string; name: string; email: string; department: string }
}

export interface Paginated<T> { data: T[]; total: number; page: number; pages: number }

// ── Auth ──────────────────────────────────────────────
export const adminAuthApi = {
  login: (email: string, password: string) =>
    adminRequest<{ token: string; admin: AdminUser }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    }),
  me: () => adminRequest<AdminUser>('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    adminRequest<{ message: string }>('/auth/change-password', {
      method: 'PUT', body: JSON.stringify({ oldPassword, newPassword })
    }),
  updateProfile: (name: string) =>
    adminRequest<AdminUser>('/auth/update-profile', {
      method: 'PUT', body: JSON.stringify({ name })
    }),
}

// ── Stats & Charts ────────────────────────────────────
export const adminStatsApi = {
  getStats: () => adminRequest<AdminStats>('/stats'),
  getChartData: () => adminRequest<ChartData>('/charts'),
}

// ── Students ──────────────────────────────────────────
export const adminStudentsApi = {
  getAll: (params: Record<string,string|number>) => {
    const qs = new URLSearchParams(params as any).toString()
    return adminRequest<{ students: Student[]; total: number; page: number; pages: number }>(`/students?${qs}`)
  },
  getById: (id: string) => adminRequest<Student>(`/students/${id}`),
  update: (id: string, data: Partial<Student>) =>
    adminRequest<Student>(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => adminRequest<{ message: string }>(`/students/${id}`, { method: 'DELETE' }),
  suspend: (id: string) => adminRequest<{ message: string; student: Student }>(`/students/${id}/suspend`, { method: 'PUT' }),
  activate: (id: string) => adminRequest<{ message: string; student: Student }>(`/students/${id}/activate`, { method: 'PUT' }),
}

// ── Skills ────────────────────────────────────────────
export const adminSkillsApi = {
  getAll: () => adminRequest<SkillStat[]>('/skills'),
  rename: (oldName: string, newName: string) =>
    adminRequest<{ message: string }>('/skills/rename', { method: 'PUT', body: JSON.stringify({ oldName, newName }) }),
  delete: (name: string) => adminRequest<{ message: string }>(`/skills/${encodeURIComponent(name)}`, { method: 'DELETE' }),
}

// ── Requests ──────────────────────────────────────────
export const adminRequestsApi = {
  getAll: (params: Record<string,string|number>) => {
    const qs = new URLSearchParams(params as any).toString()
    return adminRequest<{ requests: LearningRequest[]; total: number; page: number; pages: number }>(`/requests?${qs}`)
  },
  approve: (id: string) => adminRequest<{ message: string }>(`/requests/${id}/approve`, { method: 'PUT' }),
  reject: (id: string) => adminRequest<{ message: string }>(`/requests/${id}/reject`, { method: 'PUT' }),
  delete: (id: string) => adminRequest<{ message: string }>(`/requests/${id}`, { method: 'DELETE' }),
}

// ── Reports ───────────────────────────────────────────
export const adminReportsApi = {
  get: (type: 'monthly' | 'students' | 'skills' | 'departments') =>
    adminRequest<any>(`/reports?type=${type}`),
}

// ── Notifications ─────────────────────────────────────
export const adminNotificationsApi = {
  getAll: () => adminRequest<any[]>('/notifications'),
  markRead: (id: string) => adminRequest<{ message: string }>(`/notifications/${id}/read`, { method: 'PUT' }),
  delete: (id: string) => adminRequest<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
}

// ── Course Directory ───────────────────────────────────
export interface Course {
  id: string; name: string; description: string; category: string; icon: string; isActive: boolean; createdAt: string
}

export const adminCoursesApi = {
  getAll: () => adminRequest<Course[]>('/courses'),
  create: (data: Partial<Course>) => adminRequest<Course>('/courses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Course>) => adminRequest<Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => adminRequest<{ message: string }>(`/courses/${id}`, { method: 'DELETE' }),
}

// ── Student Extended ──────────────────────────────────
export const adminStudentsExtApi = {
  create: (data: any) => adminRequest<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (id: string) => adminRequest<any>(`/students/${id}/profile`),
}
