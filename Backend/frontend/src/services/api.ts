// Central API client for SkillSwap
// Uses fetch() (no extra deps needed) — auto-attaches JWT from localStorage

const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'

function getToken(): string | null {
  return localStorage.getItem('skillswap_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  department?: string
  section?: string
  year?: string
  college?: string
  skillsOffered?: string[]
  completedCourses?: string[]
  certificates?: string[]
  profileImage?: string
  availability?: string
  rating?: number
  reviewCount?: number
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export const authApi = {
  register: (data: {
    name: string
    email: string
    password: string
    department?: string
    section?: string
    year?: string
    college?: string
    profileImage?: string
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
}

// ── Users ─────────────────────────────────────────────
export const usersApi = {
  getProfile: () => request<AuthUser>('/users/profile'),

  updateProfile: (data: Partial<AuthUser>) =>
    request<AuthUser>('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),

  getUserById: (id: string) => request<AuthUser>(`/users/${id}`),

  search: (params: { q?: string; department?: string; section?: string; year?: string; availability?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString()
    return request<AuthUser[]>(`/users/search${qs ? '?' + qs : ''}`)
  },

  addSkill: (type: 'offered', skill: string) =>
    request<{ message: string; user: AuthUser }>('/users/profile/skills', {
      method: 'POST',
      body: JSON.stringify({ type, skill }),
    }),

  removeSkill: (type: 'offered', skill: string) =>
    request<{ message: string; user: AuthUser }>('/users/profile/skills', {
      method: 'DELETE',
      body: JSON.stringify({ type, skill }),
    }),
}

// ── Match ─────────────────────────────────────────────
export interface MatchResult {
  user: AuthUser & { id: string }
  matchPercentage: number
  commonSkills: string[]
  details: {
    theyOfferMe: string[]
    iOfferThem: string[]
  }
}

export const matchApi = {
  getMatches: () => request<MatchResult[]>('/match'),
}

// ── Search ────────────────────────────────────────────
export const searchApi = {
  searchByCourse: (q: string) => request<{ students: any[], courses: any[] }>(`/search?q=${encodeURIComponent(q)}`),
  getSuggestions: (q: string) => request<any[]>(`/search/suggestions?q=${encodeURIComponent(q)}`),
}

// ── Notifications ──────────────────────────────────────
export const notificationApi = {
  get: () => request<{ notifications: any[], unreadCount: number }>('/notifications'),
  markRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request('/notifications/read-all', { method: 'PUT' }),
  delete: (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
}

// ── Courses ────────────────────────────────────────────
export const courseApi = {
  getAll: () => request<any[]>('/courses'),
}

// ── Requests ──────────────────────────────────────────
export const requestApi = {
  create: (data: { toUserId: string, skill: string, courseName?: string, message?: string }) => 
    request<any>('/requests', { method: 'POST', body: JSON.stringify(data) }),
  getReceived: () => request<any[]>('/requests/received'),
  getSent: () => request<any[]>('/requests/sent'),
  accept: (id: string) => request(`/requests/${id}/accept`, { method: 'PUT' }),
  reject: (id: string) => request(`/requests/${id}/reject`, { method: 'PUT' }),
}
