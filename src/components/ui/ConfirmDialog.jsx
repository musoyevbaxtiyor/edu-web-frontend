import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Tasdiqlaysizmi?',
  message = "Bu amalni ortga qaytarib bo'lmaydi.",
  confirmText = "Ha, o'chirish",
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Bekor qilish</Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>{confirmText}</Button>
        </>
      }
    >
      <div className="row gap-3" style={{ alignItems: 'flex-start' }}>
        <div className="stat-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)', width: 44, height: 44 }}>
          <AlertTriangle />
        </div>
        <p className="text-secondary" style={{ paddingTop: 4 }}>{message}</p>
      </div>
    </Modal>
  )
}
