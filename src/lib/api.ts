const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error?: string }).error ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface ApiSource {
  id: string
  name: string
  address: string
  status: 'active' | 'inactive'
  liveCamera?: boolean
}

export const sourcesApi = {
  list: () =>
    request<ApiSource[]>('/api/v1/sources'),

  create: (body: Omit<ApiSource, 'id'>) =>
    request<ApiSource>('/api/v1/sources', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<Omit<ApiSource, 'id'>>) =>
    request<ApiSource>(`/api/v1/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    request<void>(`/api/v1/sources/${id}`, { method: 'DELETE' }),
}
