import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import ApplicationForm from '../components/ApplicationForm.jsx'

/** Handles both /applications/new and /applications/:id/edit. */
export default function ApplicationEditorPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [initial, setInitial] = useState(isEdit ? null : {})
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    api.getApplication(id).then(setInitial).catch((e) => setError(e.message))
  }, [id, isEdit])

  async function handleSubmit(values) {
    if (isEdit) await api.updateApplication(id, values)
    else await api.createApplication(values)
    navigate('/applications')
  }

  return (
    <div className="stack narrow">
      <h1>{isEdit ? 'Edit application' : 'Add application'}</h1>
      {error && <div className="alert" role="alert">{error}</div>}
      {initial ? (
        <ApplicationForm
          key={id || 'new'}
          initialValues={isEdit ? initial : undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate(-1)}
          submitLabel={isEdit ? 'Save changes' : 'Add application'}
        />
      ) : (
        !error && <p className="muted">Loading…</p>
      )}
    </div>
  )
}
