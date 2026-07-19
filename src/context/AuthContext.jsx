import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return null
    }
    try {
      const { data } = await api.get('/auth/me')
      const me = data.user || data
      setUser(me)
      return me
    } catch {
      setToken(null)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      setToken(data.token)
      const me = await loadMe()
      return me || data
    },
    [loadMe],
  )

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload)
      setToken(data.token)
      const me = await loadMe()
      return me || data
    },
    [loadMe],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser: loadMe,
    setUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return ctx
}
