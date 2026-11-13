import { useState } from 'react'
import { STATUSES, todayIso } from '../constants.js'
import { validate } from './validation.js'

const EMPTY = {
  company: '',
  role: '',
  location: '',
  jobUrl: '',
  status: 'APPLIED',
  appliedDate: todayIso(),
  notes: '',
}

export default function ApplicationForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save' }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, ...normalize(initialValues) }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const clientErrors = validate(values)
    setErrors(clientErrors)
    setFormError('')
    if (Object.keys(clientErrors).length) return

    setSaving(true)
    try {
      await onSubmit({ ...values, appliedDate: values.appliedDate || null })
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setFormError(err.message || 'Could not save')
      setSaving(false)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert" role="alert">{formError}</div>}

      <div className="grid-2">
        <Field label="Company" error={errors.company}>
          <input value={values.company} onChange={set('company')} maxLength={150} autoFocus />
        </Field>
        <Field label="Role" error={errors.role}>
          <input value={values.role} onChange={set('role')} maxLength={150} />
        </Field>
        <Field label="Location" error={errors.location}>
          <input value={values.location} onChange={set('location')} maxLength={150} placeholder="Remote, Dallas TX…" />
        </Field>
        <Field label="Job link" error={errors.jobUrl}>
          <input value={values.jobUrl} onChange={set('jobUrl')} maxLength={1000} placeholder="https://…" />
        </Field>
        <Field label="Status" error={errors.status}>
          <select value={values.status} onChange={set('status')}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Date applied" error={errors.appliedDate}>
          <input type="date" value={values.appliedDate} max={todayIso()} onChange={set('appliedDate')} />
        </Field>
      </div>

      <Field label="Notes" error={errors.notes}>
        <textarea rows={4} value={values.notes} onChange={set('notes')} maxLength={4000}
          placeholder="Recruiter name, referral, interview prep…" />
      </Field>

      <div className="form-actions">
        {onCancel && <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, children }) {
  return (
    <label className={`field${error ? ' has-error' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

function normalize(v) {
  if (!v) return {}
  // Keep only the editable fields (drop id, createdAt, …) and turn nulls into empty inputs.
  return Object.fromEntries(Object.keys(EMPTY).filter((k) => k in v).map((k) => [k, v[k] ?? '']))
}
