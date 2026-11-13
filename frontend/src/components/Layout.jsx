import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'

export default function Layout() {
  const { user, logout } = useAuth()
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">A</span>
          ApplyTrack
        </div>
        <nav className="nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/applications">Applications</NavLink>
        </nav>
        <div className="user">
          <span className="user-name">{user?.name}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>Log out</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
