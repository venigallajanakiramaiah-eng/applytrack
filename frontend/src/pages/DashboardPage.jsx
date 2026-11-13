import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api/client.js'
import { STATUSES } from '../constants.js'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.getStats()
      .then((s) => active && setStats(s))
      .catch((e) => active && setError(e.message))
    return () => { active = false }
  }, [])

  if (error) return <div className="alert" role="alert">{error}</div>
  if (!stats) return <p className="muted">Loading dashboard…</p>

  if (stats.total === 0) {
    return (
      <div className="card empty">
        <h2>No applications yet</h2>
        <p className="muted">Add your first job application to start tracking your search.</p>
        <Link className="btn btn-primary" to="/applications/new">Add application</Link>
      </div>
    )
  }

  const weekly = stats.weekly.map((w) => ({
    week: shortDate(w.weekStart),
    count: w.count,
  }))

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Dashboard</h1>
        <Link className="btn btn-primary" to="/applications/new">Add application</Link>
      </div>

      <section className="stat-grid" aria-label="Summary">
        <Stat label="Total tracked" value={stats.total} />
        <Stat label="Submitted" value={stats.submitted} />
        <Stat label="Applied in last 30 days" value={stats.appliedLast30Days} />
        <Stat label="Response rate" value={`${stats.responseRate}%`}
          hint="Interviews, offers and rejections ÷ submitted" />
      </section>

      <section className="card">
        <h2>Pipeline</h2>
        <PipelineBar byStatus={stats.byStatus} total={stats.total} />
      </section>

      <section className="card">
        <h2>Applications per week</h2>
        <div className="chart">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekly} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: 'var(--hover)' }} />
              <Bar dataKey="count" name="Applications" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, hint }) {
  return (
    <div className="card stat" title={hint}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function PipelineBar({ byStatus, total }) {
  return (
    <>
      <div className="pipeline" role="img" aria-label="Applications by status">
        {STATUSES.filter((s) => byStatus[s.value] > 0).map((s) => (
          <div key={s.value} style={{ flex: byStatus[s.value], background: s.color }}
            title={`${s.label}: ${byStatus[s.value]}`} />
        ))}
      </div>
      <ul className="legend">
        {STATUSES.map((s) => (
          <li key={s.value}>
            <Link to={`/applications?status=${s.value}`}>
              <span className="dot" style={{ background: s.color }} />
              {s.label} <strong>{byStatus[s.value] ?? 0}</strong>
              <span className="muted"> ({total ? Math.round(((byStatus[s.value] ?? 0) * 100) / total) : 0}%)</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
