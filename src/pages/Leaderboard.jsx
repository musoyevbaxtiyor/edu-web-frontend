import { Trophy, Crown, Medal, Award } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { RowsSkeleton } from '../components/Skeletons'
import { EmptyState, Avatar } from '../components/ui'
import { useRatings } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { fileUrl } from '../lib/api'

const MEDALS = {
  1: { color: '#f59e0b', label: "1-o'rin", icon: Crown },
  2: { color: '#94a3b8', label: "2-o'rin", icon: Medal },
  3: { color: '#b45309', label: "3-o'rin", icon: Award },
}

function PodiumCard({ row, place, me }) {
  const m = MEDALS[place]
  const Icon = m.icon
  const first = place === 1
  const student = row.student || {}
  return (
    <div
      className="card card-pad"
      style={{
        flex: '1 1 170px',
        maxWidth: first ? 260 : 220,
        order: place === 2 ? 1 : place === 1 ? 2 : 3,
        textAlign: 'center',
        transform: first ? 'translateY(-14px)' : 'none',
        border: `1px solid ${m.color}`,
        background: me ? 'var(--grad-brand-soft)' : undefined,
        boxShadow: first ? 'var(--shadow-lg)' : undefined,
      }}
    >
      <div
        className="center"
        style={{
          width: first ? 60 : 48,
          height: first ? 60 : 48,
          borderRadius: '50%',
          margin: '0 auto 12px',
          background: m.color,
          color: '#fff',
        }}
      >
        <Icon />
      </div>
      <Avatar
        name={student.name}
        src={student.avatar ? fileUrl(student.avatar) : undefined}
        size={first ? 'xl' : 'lg'}
        style={{ margin: '0 auto 10px' }}
      />
      <div style={{ fontWeight: 700, fontSize: first ? '1.05rem' : '.95rem' }}>{student.name || '—'}</div>
      <div className="text-muted" style={{ fontSize: '.78rem', wordBreak: 'break-word' }}>{student.email}</div>
      <span className="badge" style={{ marginTop: 10, background: m.color, color: '#fff', border: 'none' }}>
        {m.label}
      </span>
      <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: first ? '1.9rem' : '1.5rem' }}>
        {row.totalScore ?? 0}
      </div>
      <div className="text-muted" style={{ fontSize: '.76rem' }}>jami ball</div>
    </div>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const { data: ratings, isLoading } = useRatings()
  const myId = user?._id || user?.id
  const isMe = (r) => myId && r.student?._id === myId

  const rows = ratings || []
  const top3 = rows.slice(0, 3)

  return (
    <div>
      <PageHeader title="Reyting" subtitle="Eng faol o'quvchilar" />

      {isLoading ? (
        <RowsSkeleton rows={6} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Reyting bo'sh"
          message="Hozircha reytingda hech kim yo'q. Vazifalarni bajaring va testlarni yeching!"
        />
      ) : (
        <>
          {rows.length >= 3 && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'flex-end',
                gap: 16,
                marginBottom: 32,
                marginTop: 8,
              }}
            >
              {top3.map((r) => (
                <PodiumCard key={r.student?._id || r.rank} row={r} place={r.rank} me={isMe(r)} />
              ))}
            </div>
          )}

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>#</th>
                  <th>O'quvchi</th>
                  <th style={{ textAlign: 'right' }}>Jami ball</th>
                  <th style={{ textAlign: 'right' }}>Vazifa balli</th>
                  <th style={{ textAlign: 'right' }}>Test balli</th>
                  <th style={{ textAlign: 'right' }}>Test aniqligi</th>
                  <th style={{ textAlign: 'right' }}>Tugatilgan darslar</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const student = r.student || {}
                  const medal = MEDALS[r.rank]
                  const mine = isMe(r)
                  return (
                    <tr key={student._id || r.rank} style={mine ? { background: 'var(--grad-brand-soft)' } : undefined}>
                      <td>
                        <span
                          className="center"
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: '.82rem',
                            background: medal ? medal.color : 'var(--surface-2)',
                            color: medal ? '#fff' : 'var(--text-muted)',
                          }}
                        >
                          {r.rank}
                        </span>
                      </td>
                      <td>
                        <div className="row gap-3">
                          <Avatar
                            name={student.name}
                            src={student.avatar ? fileUrl(student.avatar) : undefined}
                            size="sm"
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600 }}>
                              {student.name || '—'}
                              {mine && <span className="badge badge-brand" style={{ marginLeft: 8 }}>Siz</span>}
                            </div>
                            <div className="text-muted" style={{ fontSize: '.76rem', wordBreak: 'break-word' }}>{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.totalScore ?? 0}</td>
                      <td style={{ textAlign: 'right' }}>{r.submissionScore ?? 0}</td>
                      <td style={{ textAlign: 'right' }}>{r.testScore ?? 0}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="badge badge-info">{r.testAccuracy ?? 0}%</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{r.completedLessons ?? 0}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
