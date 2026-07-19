import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({ open, onClose, title, children, footer, size = 520 }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: size }} role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="modal-head">
            <h3 className="modal-title">{title}</h3>
            <Button variant="ghost" size="sm" className="btn-icon" onClick={onClose} aria-label="Yopish">
              <X />
            </Button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
