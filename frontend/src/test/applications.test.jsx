import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { validate } from '../components/validation.js'
import { get, mockFetch, post, renderApp, signIn } from './helpers.jsx'

const app = (id, company, role, status) => ({
  id, company, role, status, location: 'Dallas, TX', jobUrl: null, appliedDate: '2026-11-02', notes: null,
})

const page = (content) => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: 1 })

describe('applications list', () => {
  it('shows applications from the API', async () => {
    signIn()
    mockFetch([[get('/applications'), {
      body: page([app(1, 'Google', 'Backend Engineer', 'APPLIED'), app(2, 'Microsoft', 'SWE', 'OFFER')]),
    }]])
    renderApp('/applications')

    const rows = await screen.findAllByRole('row')
    expect(rows).toHaveLength(3) // header + 2
    expect(within(rows[1]).getByText('Google')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Offer', { selector: '.badge' })).toBeInTheDocument()
  })

  it('sends the status filter to the API', async () => {
    signIn()
    const fetchMock = mockFetch([[get('/applications'), { body: page([]) }]])
    const user = userEvent.setup()
    renderApp('/applications')

    await screen.findByText('No applications yet.')
    await user.click(screen.getByRole('button', { name: 'Interviewing' }))

    expect(await screen.findByText('No applications match these filters.')).toBeInTheDocument()
    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(urls.some((u) => u.includes('status=INTERVIEWING'))).toBe(true)
  })

  it('updates status inline', async () => {
    signIn()
    mockFetch([
      [get('/applications'), { body: page([app(1, 'Google', 'Backend Engineer', 'APPLIED')]) }],
      [(url, o) => o.method === 'PATCH' && url === '/api/applications/1/status',
        (_url, o) => ({ body: app(1, 'Google', 'Backend Engineer', JSON.parse(o.body).status) })],
    ])
    const user = userEvent.setup()
    renderApp('/applications')

    await user.selectOptions(await screen.findByLabelText('Change status for Google'), 'INTERVIEWING')
    expect(await screen.findByText('Interviewing', { selector: '.badge' })).toBeInTheDocument()
  })
})

describe('application form', () => {
  it('validates required fields and URL format', () => {
    const errors = validate({ company: ' ', role: '', jobUrl: 'linkedin.com/job', appliedDate: '' })
    expect(errors).toEqual({
      company: 'Company is required',
      role: 'Role is required',
      jobUrl: 'Link must start with http:// or https://',
    })
  })

  it('creates an application and returns to the list', async () => {
    signIn()
    const fetchMock = mockFetch([
      [post('/applications'), (_url, o) => ({ status: 201, body: { id: 9, ...JSON.parse(o.body) } })],
      [get('/applications'), { body: page([app(9, 'Stripe', 'Full Stack Engineer', 'APPLIED')]) }],
    ])
    const user = userEvent.setup()
    renderApp('/applications/new')

    await user.type(screen.getByLabelText('Company'), 'Stripe')
    await user.type(screen.getByLabelText('Role'), 'Full Stack Engineer')
    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(await screen.findByRole('heading', { name: 'Applications' })).toBeInTheDocument()
    const createCall = fetchMock.mock.calls.find(([, o]) => o?.method === 'POST')
    expect(JSON.parse(createCall[1].body)).toMatchObject({ company: 'Stripe', role: 'Full Stack Engineer', status: 'APPLIED' })
  })

  it('does not call the API when the form is invalid', async () => {
    signIn()
    const fetchMock = mockFetch([])
    const user = userEvent.setup()
    renderApp('/applications/new')

    await user.click(screen.getByRole('button', { name: 'Add application' }))

    expect(screen.getByText('Company is required')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
