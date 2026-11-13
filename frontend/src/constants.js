// Must match the backend ApplicationStatus enum.
export const STATUSES = [
  { value: 'SAVED', label: 'Saved', color: '#64748b' },
  { value: 'APPLIED', label: 'Applied', color: '#2563eb' },
  { value: 'INTERVIEWING', label: 'Interviewing', color: '#d97706' },
  { value: 'OFFER', label: 'Offer', color: '#16a34a' },
  { value: 'REJECTED', label: 'Rejected', color: '#dc2626' },
  { value: 'WITHDRAWN', label: 'Withdrawn', color: '#94a3b8' },
]

export const STATUS_BY_VALUE = Object.fromEntries(STATUSES.map((s) => [s.value, s]))

export function formatDate(iso) {
  if (!iso) return '—'
  // Parse YYYY-MM-DD as a local date (avoids an off-by-one day from UTC parsing).
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
