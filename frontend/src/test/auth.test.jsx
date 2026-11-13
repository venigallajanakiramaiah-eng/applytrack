import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { get, mockFetch, post, renderApp } from './helpers.jsx'

const emptyStats = {
  total: 0, submitted: 0, responseRate: 0, appliedLast30Days: 0, byStatus: {}, weekly: [],
}

describe('authentication', () => {
  it('redirects signed-out users to the login page', () => {
    renderApp('/applications')
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
  })

  it('logs in, stores the token and shows the dashboard', async () => {
    const fetchMock = mockFetch([
      [post('/auth/login'), { body: { token: 'jwt-123', userId: 1, name: 'Ram', email: 'ram@example.com' } }],
      [get('/applications/stats'), { body: emptyStats }],
    ])
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('Email'), 'ram@example.com')
    await user.type(screen.getByLabelText('Password'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('No applications yet')).toBeInTheDocument()
    expect(localStorage.getItem('applytrack.token')).toBe('jwt-123')
    // The stats call must carry the JWT.
    const statsCall = fetchMock.mock.calls.find(([url]) => String(url).includes('/stats'))
    expect(statsCall[1].headers.Authorization).toBe('Bearer jwt-123')
  })

  it('shows the server error for a wrong password', async () => {
    mockFetch([[post('/auth/login'), { status: 401, body: { message: 'Invalid email or password' } }]])
    const user = userEvent.setup()
    renderApp('/login')

    await user.type(screen.getByLabelText('Email'), 'ram@example.com')
    await user.type(screen.getByLabelText('Password'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(localStorage.getItem('applytrack.token')).toBeNull()
  })
})
