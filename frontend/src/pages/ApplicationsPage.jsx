import { useCallback, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client.js'
import StatusBadge from '../components/StatusBadge.jsx'
import { STATUSES, formatDate } from '../constants.js'

const PAGE_SIZE = 20

export default function ApplicationsPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const q = params.get('q') || ''
  const page = Number(params.get('page') || 0)

  const [search, setSearch] = useState(q)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  const updateParams = useCallback((changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => (v === '' || v == null ? next.delete(k) : next.set(k, v)))
    if (!('page' in changes)) next.delete('page')
    setParams(next, { replace: true })
  }, [params, setParams])

  const load = useCallback(() => {
    return api.listApplications({ status, q, page, size: PAGE_SIZE })
      .then((result) => { setData(result); setError('') })
      .catch((e) => setError(e.message))
  }, [status, q, page])

  useEffect(() => { load() }, [load])

  // Debounce the search box so we don't call the API on every keystroke.
  useEffect(() => {
    if (search === q) return undefined
    const t = setTimeout(() => updateParams({ q: search.trim() }), 300)
    return () => clearTimeout(t)
  }, [search, q, updateParams])

  async function changeStatus(app, newStatus) {
    try {
      const updated = await api.updateStatus(app.id, newStatus)
      setData((d) => ({ ...d, content: d.content.map((a) => (a.id === app.id ? updated : a)) }))
    } catch (e) {
      setError(e.message)
    }
  }

  async function remove(app) {
    if (!window.confirm(`Delete ${app.role} at ${app.company}?`)) return
    try {
      await api.deleteApplication(app.id)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Applications</h1>
        <Link className="btn btn-primary" to="/applications/new">Add application</Link>
      </div>

      <div className="toolbar">
        <input className="search" type="search" placeholder="Search company or role…" aria-label="Search"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="chips" role="group" aria-label="Filter by status">
          <button type="button" className={`chip${status === '' ? ' active' : ''}`}
            onClick={() => updateParams({ status: '' })}>All</button>
          {STATUSES.map((s) => (
            <button key={s.value} type="button" className={`chip${status === s.value ? ' active' : ''}`}
              onClick={() => updateParams({ status: s.value })}>{s.label}</button>
          ))}
        </div>
      </div>

      {error && <div className="alert" role="alert">{error}</div>}

      {!data ? (
        <p className="muted">Loading…</p>
      ) : data.content.length === 0 ? (
        <div className="card empty">
          <p className="muted">{status || q ? 'No applications match these filters.' : 'No applications yet.'}</p>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Location</th>
                <th>Applied</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((app) => (
                <tr key={app.id}>
                  <td className="strong">
                    {app.jobUrl ? <a href={app.jobUrl} target="_blank" rel="noreferrer">{app.company}</a> : app.company}
                  </td>
                  <td>{app.role}</td>
                  <td className="muted">{app.location || '—'}</td>
                  <td className="muted nowrap">{formatDate(app.appliedDate)}</td>
                  <td>
                    <div className="status-cell">
                      <StatusBadge status={app.status} />
                      <select aria-label={`Change status for ${app.company}`} value={app.status}
                        onChange={(e) => changeStatus(app, e.target.value)}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </td>
                  <td className="actions">
                    <Link className="btn btn-ghost btn-sm" to={`/applications/${app.id}/edit`}>Edit</Link>
                    <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => remove(app)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="pager">
          <button type="button" className="btn btn-ghost" disabled={page === 0}
            onClick={() => updateParams({ page: page - 1 })}>Previous</button>
          <span className="muted">Page {page + 1} of {data.totalPages} · {data.totalElements} total</span>
          <button type="button" className="btn btn-ghost" disabled={page + 1 >= data.totalPages}
            onClick={() => updateParams({ page: page + 1 })}>Next</button>
        </div>
      )}
    </div>
  )
}
