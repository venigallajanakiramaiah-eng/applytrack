// Small fetch wrapper: adds the JWT, parses JSON, and turns error responses into ApiError.

const TOKEN_KEY = 'applytrack.token'

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

let unauthorizedHandler = () => {}

/** Called by AuthContext so an expired token logs the user out everywhere. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable (private mode etc.): the session just won't persist
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && token && !path.startsWith('/auth/')) {
      unauthorizedHandler()
    }
    throw new ApiError(
      response.status,
      data?.message || `Request failed (${response.status})`,
      data?.errors || {},
    )
  }
  return data
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password) =>
    request('/auth/register', { method: 'POST', body: { name, email, password } }),

  listApplications: ({ status, q, page = 0, size = 20 } = {}) => {
    const params = new URLSearchParams({ page, size })
    if (status) params.set('status', status)
    if (q) params.set('q', q)
    return request(`/applications?${params}`)
  },
  getApplication: (id) => request(`/applications/${id}`),
  createApplication: (data) => request('/applications', { method: 'POST', body: data }),
  updateApplication: (id, data) => request(`/applications/${id}`, { method: 'PUT', body: data }),
  updateStatus: (id, status) => request(`/applications/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteApplication: (id) => request(`/applications/${id}`, { method: 'DELETE' }),
  getStats: () => request('/applications/stats'),
}
