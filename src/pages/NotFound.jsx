import { Link } from 'react-router-dom'
import { Home, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="center" style={{ minHeight: '100vh', padding: 24, textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(5rem, 18vw, 10rem)', fontWeight: 800, lineHeight: 1 }} className="text-gradient">404</div>
        <h1 style={{ fontSize: '1.5rem', marginTop: 8 }}>Sahifa topilmadi</h1>
        <p className="text-muted" style={{ maxWidth: 400, margin: '12px auto 28px' }}>
          Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
        </p>
        <div className="row gap-3 center wrap">
          <Link to="/" className="btn btn-primary"><Home /> Bosh sahifa</Link>
          <Link to="/dashboard" className="btn btn-secondary"><Compass /> Boshqaruv paneli</Link>
        </div>
      </div>
    </div>
  )
}
