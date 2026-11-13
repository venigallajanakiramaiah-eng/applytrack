import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, getToken, onUnauthorized, setToken } from '../api/client.js'

const USER_KEY = 'applytrack.user'
const AuthContext = createContext(null)

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw && getToken() ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const logout = useCallback(() => {
    setToken(null)
    saveUser(null)
    setUser(null)
  }, [])

  useEffect(() => {
    onUnauthorized(logout)
  }, [logout])

  const handleAuth = useCallback((res) => {
    setToken(res.token)
    const u = { id: res.userId, name: res.name, email: res.email }
    saveUser(u)
    setUser(u)
  }, [])

  const login = useCallback(async (email, password) => handleAuth(await api.login(email, password)), [handleAuth])
  const register = useCallback(
    async (name, email, password) => handleAuth(await api.register(name, email, password)),
    [handleAuth],
  )

  const value = useMemo(() => ({ user, login, register, logout }), [user, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
