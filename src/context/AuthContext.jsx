import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { api, getToken, setToken, UNAUTHORIZED_EVENT } from '../lib/api'
import { queryClient } from '../lib/queryClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // /auth/me tarmoq / server xatosi bilan tugasa (token saqlanadi, qayta urinish mumkin)
  const [authError, setAuthError] = useState(null)
  // Sessiya 401 bilan tugaganini login sahifasida ko'rsatish uchun
  const [sessionExpired, setSessionExpired] = useState(false)
  const userRef = useRef(null)
  userRef.current = user

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setAuthError(null)
      setLoading(false)
      return null
    }
    try {
      const { data } = await api.get('/auth/me')
      const me = data.user || data
      setUser(me)
      setAuthError(null)
      return me
    } catch (err) {
      if (err.status === 401) {
        // Token haqiqatan yaroqsiz — chiqarib yuboramiz
        setToken(null)
        setUser(null)
        setAuthError(null)
      } else {
        // Tarmoq / timeout / 5xx — tokenni o'chirmaymiz (server uyg'onayotgan bo'lishi mumkin)
        setAuthError(err.message)
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  // Sessiya davomida 401 kelsa (api.js xabar beradi) — foydalanuvchini chiqaramiz
  useEffect(() => {
    const onUnauthorized = () => {
      if (!userRef.current) return
      userRef.current = null
      queryClient.clear()
      setUser(null)
      setAuthError(null)
      setSessionExpired(true)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password })
      queryClient.clear() // oldingi foydalanuvchi keshi qolmasin
      setSessionExpired(false)
      setToken(data.token)
      const me = await loadMe()
      return me || data
    },
    [loadMe],
  )

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload)
      queryClient.clear()
      setSessionExpired(false)
      setToken(data.token)
      const me = await loadMe()
      return me || data
    },
    [loadMe],
  )

  const logout = useCallback(() => {
    setToken(null)
    queryClient.clear()
    setUser(null)
    setAuthError(null)
    setSessionExpired(false)
  }, [])

  const value = {
    user,
    role: user?.role || null,
    isAuthenticated: !!user,
    loading,
    authError,
    sessionExpired,
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
