import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../App.jsx'
import { AuthProvider } from '../auth/AuthContext.jsx'

/** Renders the whole app at a URL. */
export function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

export function signIn() {
  localStorage.setItem('applytrack.token', 'test-token')
  localStorage.setItem('applytrack.user', JSON.stringify({ id: 1, name: 'Ram', email: 'ram@example.com' }))
}

/**
 * Mocks fetch with a list of [matcher, response] routes.
 * matcher: (url, options) => boolean; response: { status, body } or a function returning one.
 */
export function mockFetch(routes) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options = {}) => {
    const route = routes.find(([match]) => match(String(url), options))
    if (!route) throw new Error(`Unexpected request: ${options.method || 'GET'} ${url}`)
    const res = typeof route[1] === 'function' ? route[1](String(url), options) : route[1]
    const status = res.status ?? 200
    return new Response(status === 204 ? null : JSON.stringify(res.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
}

export const get = (path) => (url, o) => (o.method || 'GET') === 'GET' && url.startsWith(`/api${path}`)
export const post = (path) => (url, o) => o.method === 'POST' && url === `/api${path}`
