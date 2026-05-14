const BASE_URL = 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) headers['Authorization'] = `Bearer ${getToken()}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: '오류가 발생했습니다' }))
    const detail = err.detail
    if (Array.isArray(detail)) {
      throw new Error(detail.map(d => d.msg + ' (' + d.loc?.join('.') + ')').join(', '))
    }
    throw new Error(typeof detail === 'string' ? detail : '오류가 발생했습니다')
  }
  return res.json()
}

export const api = {
  // Auth
  login: (email, password) =>
    request('POST', '/auth/login', { email, password }, false),
  register: (data) =>
    request('POST', '/auth/register', data, false),
  requestPasswordReset: (email) =>
    request('POST', '/auth/password-reset/request', { email }, false),
  confirmPasswordReset: (token, new_password) =>
    request('POST', '/auth/password-reset/confirm', { token, new_password }, false),

  // User
  getMe: () => request('GET', '/users/me'),
  updateMe: (data) => request('PUT', '/users/me', data),

  // Experiences
  getExperiences: () => request('GET', '/experiences/'),
  createExperience: (data) => request('POST', '/experiences/', data),
  updateExperience: (id, data) => request('PUT', `/experiences/${id}`, data),
  deleteExperience: (id) => request('DELETE', `/experiences/${id}`),

  // Missions
  getMissions: () => request('GET', '/missions/'),
  createMission: (data) => request('POST', '/missions/', data),
  completeMission: (id) => request('PUT', `/missions/${id}/complete`),
  deleteMission: (id) => request('DELETE', `/missions/${id}`),

  // Community
  getPosts: (skip = 0, limit = 20) => request('GET', `/community/posts?skip=${skip}&limit=${limit}`, null, false),
  createPost: (content) => request('POST', '/community/posts', { content }),
  updatePost: (id, content) => request('PUT', `/community/posts/${id}`, { content }),
  deletePost: (id) => request('DELETE', `/community/posts/${id}`),
  toggleLike: (id) => request('POST', `/community/posts/${id}/like`),

  // Notifications
  getNotifications: () => request('GET', '/notifications/'),
  getUnreadCount: () => request('GET', '/notifications/unread-count'),
  markRead: (id) => request('PUT', `/notifications/${id}/read`),
  markAllRead: () => request('PUT', '/notifications/read-all'),

  // AI 분석
  analyzeExperience: (data) => request('POST', '/ai/analyze', data, false),
  getAnalysisHistory: () => request('GET', '/ai/history', null, false),
  getAnalysisDetail: (idx) => request('GET', `/ai/history/${idx}`, null, false),
  recommendCerts: (ncs_items, exp_type = '', exp_title = '') =>
    request('POST', '/ai/recommend-certs', { ncs_items, exp_type, exp_title }, false),

  // Senior personas
  getSeniorPersonas: (limit = 3) => request('GET', `/senior-personas/?limit=${limit}`, null, false),
  matchPersonas: (profile, k = 3) =>
    request('POST', `/senior-personas/match?k=${k}`, profile, false),

  // Survival curve
  getSurvivalCurve: (profile) =>
    request('POST', '/survival/curve', profile, false),

  // PDF
  downloadReport: async (data) => {
    const res = await fetch(`${BASE_URL}/pdf/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('PDF 생성에 실패했습니다')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `portfolio_${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}

export function saveTokens(access_token, refresh_token) {
  localStorage.setItem('access_token', access_token)
  localStorage.setItem('refresh_token', refresh_token)
}

export function logout() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

export function isLoggedIn() {
  return !!localStorage.getItem('access_token')
}
