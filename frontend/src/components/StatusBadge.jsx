import { STATUS_BY_VALUE } from '../constants.js'

export default function StatusBadge({ status }) {
  const s = STATUS_BY_VALUE[status] || { label: status, color: '#64748b' }
  return (
    <span className="badge" style={{ '--badge': s.color }}>
      {s.label}
    </span>
  )
}
