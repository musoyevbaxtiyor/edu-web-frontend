import { CheckCircle2, GraduationCap } from 'lucide-react'
import Logo from '../../components/layout/Logo'

const POINTS = [
  'Video darslar va amaliy vazifalar',
  'Real vaqtli baholash va coin mukofotlar',
  'Reyting tizimi va interaktiv testlar',
  'Istalgan qurilmada, istalgan vaqtda',
]

export default function AuthAside({ quote }) {
  return (
    <aside className="auth-aside">
      <div style={{ filter: 'brightness(0) invert(1)' }}><Logo /></div>
      <div>
        <div className="row gap-2" style={{ marginBottom: 20 }}>
          <span style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'grid', placeItems: 'center' }}>
            <GraduationCap />
          </span>
        </div>
        <p className="auth-aside-quote">{quote}</p>
        <div className="auth-aside-list">
          {POINTS.map((p) => (
            <div key={p} className="auth-aside-item">
              <span className="tick"><CheckCircle2 style={{ width: 18, height: 18 }} /></span>
              {p}
            </div>
          ))}
        </div>
      </div>
      <p style={{ opacity: 0.8, fontSize: '.86rem' }}>© {new Date().getFullYear()} EduWeb — Bilim kelajakka investitsiya.</p>
    </aside>
  )
}
