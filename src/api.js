// 외부 접속 시 루트 .env 파일에서 수정
// VITE_API_URL=https://백엔드ngrok주소.ngrok.io
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getSessionToken() {
  return localStorage.getItem('session_token')
}

async function request(method, path, body = null, auth = true) {
  const headers = { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }
  if (auth) {
    const token = getSessionToken()
    if (token) headers['X-Session-Token'] = token
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('session_token')
    }
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
  // Session
  startSession: () => request('POST', '/auth/session/start', null, false),
  endSession: () => request('POST', '/auth/session/end'),

  // User
  getMe: () => request('GET', '/users/me'),
  getUserProfile: () => request('GET', '/users/me'),
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
  recommendMissions: () => request('GET', '/missions/recommend'),
  verifyMission: async (id, text, file) => {
    const token = getSessionToken()
    const form = new FormData()
    if (text) form.append('text', text)
    if (file) form.append('file', file)
    const res = await fetch(`${BASE_URL}/missions/${id}/verify`, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { 'X-Session-Token': token } : {}) },
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '오류가 발생했습니다' }))
      throw new Error(err.detail || '오류가 발생했습니다')
    }
    return res.json()
  },
  getMissionHeatmap: () => request('GET', '/missions/heatmap'),

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
  analyzeExperience: (data) => request('POST', '/ai/analyze', data),
  analyzeBatch: () => request('POST', '/ai/analyze-batch', null),
  getAnalysisHistory: () => request('GET', '/ai/history'),
  getAnalysisDetail: (idx) => request('GET', `/ai/history/${idx}`),
  updateStarDrafts: (idx, star_drafts) => request('PATCH', `/ai/history/${idx}/star-drafts`, { star_drafts }),
  getAnalysisResults: () => request('GET', '/ai/results'),
  getAnalysisResult: (id) => request('GET', `/ai/results/${id}`),
  getStarLetters: () => request('GET', '/ai/star-letters'),
  updateStarLetter: (id, content) => request('PUT', `/ai/star-letters/${id}`, { content }),
  getNcsSummary: () => request('GET', '/ai/ncs-summary'),
  recommendCerts: (ncs_items, exp_type = '', exp_title = '', count = 5) =>
    request('POST', '/ai/recommend-certs', { ncs_items, exp_type, exp_title, count }, false),

  // Certifications
  getCertSchedule: (category = '') =>
    request('GET', `/certifications/schedule${category ? `?category=${category}` : ''}`, null, false),

  // Cert Proofs
  getCertProofs: () => request('GET', '/cert-proofs/'),
  createCertProof: async (formData) => {
    const token = getSessionToken()
    const res = await fetch(`${BASE_URL}/cert-proofs/`, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { 'X-Session-Token': token } : {}) },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '오류가 발생했습니다' }))
      throw new Error(err.detail || '오류가 발생했습니다')
    }
    return res.json()
  },
  updateCertProof: async (id, formData) => {
    const token = getSessionToken()
    const res = await fetch(`${BASE_URL}/cert-proofs/${id}`, {
      method: 'PATCH',
      headers: { 'ngrok-skip-browser-warning': 'true', ...(token ? { 'X-Session-Token': token } : {}) },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: '오류가 발생했습니다' }))
      throw new Error(err.detail || '오류가 발생했습니다')
    }
    return res.json()
  },
  deleteCertProof: (id) => request('DELETE', `/cert-proofs/${id}`),

  // Report Settings
  getReportSettings: () => request('GET', '/report-settings/'),
  updateReportSettings: (data) => request('PUT', '/report-settings/', data),

  // Senior personas
  getSeniorPersonas: (limit = 3) => request('GET', `/senior-personas/?limit=${limit}`, null, false),
  matchPersonas: (profile, k = 3) =>
    request('POST', `/senior-personas/match?k=${k}`, profile, false),

  // Survival diagnosis
  getSurvivalCurve: (userProfile) =>
    request('POST', '/survival/curve', userProfile, false),
  getSurvivalData: (userProfile) =>
    request('POST', '/survival/analyze', userProfile, false),
  verifyProfile: (profile) =>
    request('POST', '/survival/verify-profile', profile, false),

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

export function saveSessionToken(token) {
  localStorage.setItem('session_token', token)
}

export function clearSession() {
  localStorage.removeItem('session_token')
  localStorage.removeItem('mission_done_date')
  localStorage.removeItem('ncs_result')
  localStorage.removeItem('ncs_experience')
  localStorage.removeItem('exp_history')
}

export function hasSession() {
  return !!localStorage.getItem('session_token')
}
