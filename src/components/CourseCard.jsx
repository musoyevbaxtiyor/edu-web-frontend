import { Link } from 'react-router-dom'
import { BookOpen, User, ArrowRight, CheckCircle2, Lock } from 'lucide-react'
import { formatPrice } from '../lib/utils'

// Kurs nomidan barqaror gradient tanlash (rasm o'rniga chiroyli muqova)
const COVERS = [
  'linear-gradient(135deg, #6366f1, #a855f7)',
  'linear-gradient(135deg, #0ea5e9, #6366f1)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #10b981, #22d3ee)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #14b8a6, #6366f1)',
]
function coverFor(str = '') {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % COVERS.length
  return COVERS[h]
}

export default function CourseCard({ course, to, footer, badge, enrolled }) {
  const teacherName = course.teacher?.name || "O'qituvchi"
  const cover = coverFor(course.title)
  const href = to || `/courses/${course._id}`

  return (
    <article className="card card-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Link to={href} style={{ display: 'block' }}>
        <div style={{ height: 128, background: cover, position: 'relative', display: 'grid', placeItems: 'center' }}>
          <BookOpen style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.9)' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
            {badge}
            {enrolled && (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--success)', border: 'none' }}>
                <CheckCircle2 /> Yozilgan
              </span>
            )}
            {course.isPublished === false && (
              <span className="badge" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff', border: 'none' }}>
                <Lock /> Qoralama
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="card-pad stack gap-3 grow">
        <div className="grow">
          <Link to={href}>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 700, marginBottom: 6 }} className="truncate">{course.title}</h3>
          </Link>
          <p className="text-muted" style={{ fontSize: '.88rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.4em' }}>
            {course.description}
          </p>
        </div>

        <div className="between">
          <span className="row gap-2 text-secondary" style={{ fontSize: '.82rem' }}>
            <User style={{ width: 15, height: 15 }} /> {teacherName}
          </span>
          <span style={{ fontWeight: 700, color: course.price > 0 ? 'var(--text)' : 'var(--success)' }}>
            {formatPrice(course.price)}
          </span>
        </div>

        {footer || (
          <Link to={href} className="btn btn-secondary btn-block">
            Batafsil <ArrowRight />
          </Link>
        )}
      </div>
    </article>
  )
}
