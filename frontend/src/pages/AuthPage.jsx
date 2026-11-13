import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setMessage('')
    setBusy(true)
    try {
      if (isRegister) await register(form.name, form.email, form.password)
      else await login(form.email, form.password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setMessage(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden="true">A</span>
          ApplyTrack
        </div>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">
          {isRegister ? 'Track every application from saved to offer.' : 'Log in to see your job search.'}
        </p>

        {message && <div className="alert" role="alert">{message}</div>}

        {isRegister && (
          <label className="field">
            <span className="field-label">Name</span>
            <input value={form.name} onChange={set('name')} autoComplete="name" required />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
        )}
        <label className="field">
          <span className="field-label">Email</span>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input type="password" value={form.password} onChange={set('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'} required />
          {errors.password && <span className="field-error">Password {errors.password}</span>}
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <p className="muted center">
          {isRegister ? (
            <>Already have an account? <Link to="/login">Log in</Link></>
          ) : (
            <>New here? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </form>
    </div>
  )
}
