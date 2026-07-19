import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type, message, title) => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, type, message, title }])
      setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  const toast = {
    success: (msg, title) => push('success', msg, title),
    error: (msg, title) => push('error', msg, title),
    info: (msg, title) => push('info', msg, title),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-viewport" role="region" aria-label="Bildirishnomalar">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info
          const color = t.type === 'success' ? 'var(--success)' : t.type === 'error' ? 'var(--danger)' : 'var(--info)'
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role="alert">
              <Icon style={{ color }} />
              <div className="grow">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-msg">{t.message}</div>
              </div>
              <button className="btn-ghost btn-icon btn-sm" onClick={() => remove(t.id)} aria-label="Yopish">
                <X />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast ToastProvider ichida ishlatilishi kerak')
  return ctx
}
