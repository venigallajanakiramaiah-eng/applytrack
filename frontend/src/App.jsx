import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AuthPage from './pages/AuthPage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import ApplicationEditorPage from './pages/ApplicationEditorPage.jsx'

// The dashboard pulls in the charting library, so load it only when needed.
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Suspense fallback={<p className="muted">Loading…</p>}><DashboardPage /></Suspense>} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/new" element={<ApplicationEditorPage />} />
          <Route path="/applications/:id/edit" element={<ApplicationEditorPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
