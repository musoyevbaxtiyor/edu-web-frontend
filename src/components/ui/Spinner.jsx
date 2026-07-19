import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 28, label }) {
  return (
    <div className="center" style={{ flexDirection: 'column', gap: 12, padding: 40, width: '100%' }}>
      <Loader2 style={{ width: size, height: size, color: 'var(--brand-500)', animation: 'spin 0.7s linear infinite' }} />
      {label && <p className="text-muted" style={{ fontSize: '.9rem' }}>{label}</p>}
    </div>
  )
}

export function PageLoader({ label = 'Yuklanmoqda...' }) {
  return (
    <div className="center" style={{ minHeight: '60vh' }}>
      <Spinner size={36} label={label} />
    </div>
  )
}
