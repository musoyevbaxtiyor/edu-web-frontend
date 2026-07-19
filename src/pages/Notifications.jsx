import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, Clock, Bell, BellOff, Coins, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { RowsSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/ui'
import { useNotifications } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../lib/utils'

const STATUS_META = {
  approved: { label: 'Tasdiqlangan', badge: 'badge-success', icon: CheckCircle2, color: 'var(--success)', soft: 'var(--success-soft)' },
  rejected: { label: 'Rad etilgan', badge: 'badge-danger', icon: XCircle, color: 'var(--danger)', soft: 'var(--danger-soft)' },
  submitted: { label: 'Topshirildi', badge: 'badge-info', icon: Clock, color: 'var(--info)', soft: 'var(--info-soft)' },
  in_review: { label: 'Tekshirilmoqda', badge: 'badge-info', icon: Clock, color: 'var(--info)', soft: 'var(--info-soft)' },
}

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'approved', label: 'Tasdiqlangan' },
  { key: 'rejected', label: 'Rad etilgan' },
]

function NotificationRow({ n, linkTo }) {
  const meta = STATUS_META[n.status] || STATUS_META.submitted
  const Icon = meta.icon

  const body = (
    <>
      <span
        className="center"
        style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: meta.soft, color: meta.color }}
      >
        <Icon style={{ width: 20, height: 20 }} />
      </span>

      <div className="grow" style={{ minWidth: 0 }}>
        <div className="row gap-2 wrap" style={{ alignItems: 'center' }}>
          <span style={{ fontWeight: 700 }}>{n.title}</span>
          {n.course && <span className="text-muted" style={{ fontSize: '.8rem' }}>· {n.course}</span>}
        </div>
        {n.message && <p className="text-secondary" style={{ fontSize: '.88rem', marginTop: 2 }}>{n.message}</p>}
        {n.studentName && (
          <p className="text-muted" style={{ fontSize: '.8rem', marginTop: 2 }}>O'quvchi: {n.studentName}</p>
        )}
        {n.feedback && (
          <p className="text-muted" style={{ fontSize: '.82rem', marginTop: 4, fontStyle: 'italic' }}>“{n.feedback}”</p>
        )}
        <div className="text-muted" style={{ fontSize: '.76rem', marginTop: 6 }}>{timeAgo(n.date)}</div>
      </div>

      <div className="stack gap-2" style={{ alignItems: 'flex-end', flexShrink: 0 }}>
        <span className={`badge ${meta.badge}`}>{meta.label}</span>
        {n.coins > 0 && (
          <span className="badge badge-warning"><Coins style={{ width: 13, height: 13 }} /> +{n.coins}</span>
        )}
        {linkTo && <ArrowRight style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />}
      </div>
    </>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="card card-pad card-hover row gap-3" style={{ alignItems: 'flex-start', textDecoration: 'none' }}>
        {body}
      </Link>
    )
  }

  return (
    <div className="card card-pad row gap-3" style={{ alignItems: 'flex-start' }}>
      {body}
    </div>
  )
}

export default function Notifications() {
  const { role } = useAuth()
  const { data: notifications, isLoading } = useNotifications()
  const [filter, setFilter] = useState('all')

  const isTeaching = role === 'teacher' || role === 'admin'

  const list = useMemo(() => {
    let out = notifications || []
    if (filter !== 'all') out = out.filter((n) => n.status === filter)
    return out
  }, [notifications, filter])

  return (
    <div>
      <PageHeader title="Bildirishnomalar" subtitle="Oxirgi yangiliklar" />

      <div className="tabs" style={{ marginBottom: 22 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <RowsSkeleton rows={6} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={filter === 'all' ? BellOff : Bell}
          title="Bildirishnoma yo'q"
          message={
            filter === 'all'
              ? 'Hozircha yangi bildirishnomalar mavjud emas.'
              : 'Ushbu filtr bo\'yicha bildirishnoma topilmadi.'
          }
        />
      ) : (
        <div className="stack gap-3">
          {list.map((n) => (
            <NotificationRow key={n.id} n={n} linkTo={isTeaching ? '/teach/submissions' : null} />
          ))}
        </div>
      )}
    </div>
  )
}
