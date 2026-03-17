import type { Animal, Litter, Weighing, NotificationRule, UpcomingNotification, NotificationLog, DoeStats, ImportPreview } from './types'

const API_URL = ''

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

function getHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra || {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers as Record<string, string> || {}),
    },
  })
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ошибка сервера' }))
    throw new Error(err.detail || 'Ошибка')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: async (username: string, password: string): Promise<string> => {
    const data = await request<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    return data.access_token
  },

  me: () => request<{ id: number; username: string }>('/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    }),

  // ── Animals ───────────────────────────────────────────────────────────────
  getAnimals: (params?: { sex?: string; active?: boolean }): Promise<Animal[]> => {
    const qs = new URLSearchParams()
    if (params?.sex) qs.set('sex', params.sex)
    if (params?.active !== undefined) qs.set('active', String(params.active))
    return request(`/animals?${qs}`)
  },

  getAnimal: (id: number): Promise<Animal> => request(`/animals/${id}`),

  createAnimal: (data: Partial<Animal>): Promise<Animal> =>
    request('/animals', { method: 'POST', body: JSON.stringify(data) }),

  updateAnimal: (id: number, data: Partial<Animal>): Promise<Animal> =>
    request(`/animals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAnimal: (id: number) =>
    request(`/animals/${id}`, { method: 'DELETE' }),

  // ── Litters ───────────────────────────────────────────────────────────────
  getLitters: (params?: { doe_id?: number; active?: boolean }): Promise<Litter[]> => {
    const qs = new URLSearchParams()
    if (params?.doe_id) qs.set('doe_id', String(params.doe_id))
    if (params?.active !== undefined) qs.set('active', String(params.active))
    return request(`/litters?${qs}`)
  },

  getLitter: (id: number): Promise<Litter> => request(`/litters/${id}`),

  createLitter: (data: Partial<Litter>): Promise<Litter> =>
    request('/litters', { method: 'POST', body: JSON.stringify(data) }),

  updateLitter: (id: number, data: Partial<Litter>): Promise<Litter> =>
    request(`/litters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteLitter: (id: number) =>
    request(`/litters/${id}`, { method: 'DELETE' }),

  getUpcomingLitters: (days = 30): Promise<Litter[]> =>
    request(`/litters/upcoming?days=${days}`),

  // ── Weighings ─────────────────────────────────────────────────────────────
  getWeighings: (litter_id?: number): Promise<Weighing[]> => {
    const qs = litter_id ? `?litter_id=${litter_id}` : ''
    return request(`/weighings${qs}`)
  },

  createWeighing: (data: { litter_id: number; weighing_type?: string; weighing_date?: string; weights: number[]; notes?: string }): Promise<Weighing> =>
    request('/weighings', { method: 'POST', body: JSON.stringify(data) }),

  updateWeighing: (id: number, data: Partial<Weighing>): Promise<Weighing> =>
    request(`/weighings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteWeighing: (id: number) =>
    request(`/weighings/${id}`, { method: 'DELETE' }),

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotificationRules: (): Promise<NotificationRule[]> =>
    request('/notifications/rules'),

  createNotificationRule: (data: Partial<NotificationRule>): Promise<NotificationRule> =>
    request('/notifications/rules', { method: 'POST', body: JSON.stringify(data) }),

  updateNotificationRule: (id: number, data: Partial<NotificationRule>): Promise<NotificationRule> =>
    request(`/notifications/rules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteNotificationRule: (id: number) =>
    request(`/notifications/rules/${id}`, { method: 'DELETE' }),

  getUpcomingNotifications: (days = 30): Promise<UpcomingNotification[]> =>
    request(`/notifications/upcoming?days=${days}`),

  getNotificationLog: (limit = 50): Promise<NotificationLog[]> =>
    request(`/notifications/log?limit=${limit}`),

  sendTestNotification: (data: { channel: string; telegram_chat_id?: string; email_address?: string }) =>
    request('/notifications/test', { method: 'POST', body: JSON.stringify(data) }),

  // ── Excel ─────────────────────────────────────────────────────────────────
  importExcelPreview: async (file: File): Promise<ImportPreview> => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/excel/import/preview`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Ошибка' }))
      throw new Error(err.detail)
    }
    return res.json()
  },

  importExcelConfirm: (preview_id: string) =>
    request('/excel/import/confirm', { method: 'POST', body: JSON.stringify({ preview_id }) }),

  exportExcel: async (): Promise<Blob> => {
    const token = getToken()
    const res = await fetch(`/api/excel/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error('Ошибка экспорта')
    return res.blob()
  },

  // ── Stats ─────────────────────────────────────────────────────────────────
  getDoeStats: (doe_id: number): Promise<DoeStats> =>
    request(`/stats/doe/${doe_id}`),
}
