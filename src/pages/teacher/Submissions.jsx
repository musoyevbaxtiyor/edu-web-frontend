import { useState } from 'react'
import { FileCheck2, ExternalLink, ClipboardCheck, Coins, Star, MessageSquare } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { RowsSkeleton } from '../../components/Skeletons'
import { Button, Modal, EmptyState, Avatar } from '../../components/ui'
import { useTeacherSubmissions, useReviewSubmission } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDateTime } from '../../lib/utils'
import { fileUrl } from '../../lib/api'

const TABS = [
  { key: 'pending', label: 'Tekshirilmagan' },
  { key: 'all', label: 'Barchasi' },
]

const STATUS = {
  submitted: { cls: 'badge-warning', label: 'Tekshirilmoqda' },
  in_review: { cls: 'badge-warning', label: 'Tekshirilmoqda' },
  approved: { cls: 'badge-success', label: 'Tasdiqlangan' },
  rejected: { cls: 'badge-danger', label: 'Rad etilgan' },
}

const EMPTY_FORM = { grade: '', coins: '', feedback: '' }

export default function Submissions() {
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const pending = useTeacherSubmissions('pending')
  const all = useTeacherSubmissions('all')
  const review = useReviewSubmission()

  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [action, setAction] = useState(null)

  const active = tab === 'pending' ? pending : all
  const list = active.data || []

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const openReview = (s) => {
    setSelected(s)
    setForm({
      grade: s.grade ?? '',
      coins: s.coins ?? '',
      feedback: s.feedback || '',
    })
  }

  const closeReview = () => {
    if (review.isPending) return
    setSelected(null)
    setAction(null)
    setForm(EMPTY_FORM)
  }

  const submit = async (status) => {
    if (!selected) return
    if (form.grade !== '' && (Number(form.grade) < 0 || Number(form.grade) > 100)) {
      toast.error('Baho 0 dan 100 gacha bo\'lishi kerak.')
      return
    }
    setAction(status)
    try {
      await review.mutateAsync({
        submissionId: selected._id,
        grade: form.grade === '' ? null : Number(form.grade),
        coins: Number(form.coins) || 0,
        feedback: form.feedback.trim(),
        status,
      })
      toast.success(status === 'approved' ? 'Topshiriq tasdiqlandi.' : 'Topshiriq rad etildi.')
      setSelected(null)
      setForm(EMPTY_FORM)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAction(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Topshiriqlar"
        subtitle="O'quvchilar yuborgan vazifalarni ko'rib chiqing va baholang."
      />

      <div className="tabs" style={{ marginBottom: 22 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === 'pending' && pending.data?.length ? ` (${pending.data.length})` : ''}
          </button>
        ))}
      </div>

      {active.isLoading ? (
        <RowsSkeleton rows={6} />
      ) : !list.length ? (
        <EmptyState
          icon={FileCheck2}
          title="Topshiriq yo'q"
          message={
            tab === 'pending'
              ? 'Hozircha tekshirishni kutayotgan topshiriq yo\'q.'
              : 'Hali birorta topshiriq yuborilmagan.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Dars</th>
                <th>Status</th>
                <th>Sana</th>
                <th>Baho</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const st = STATUS[s.status] || STATUS.submitted
                const canReview = s.status === 'submitted' || s.status === 'in_review'
                return (
                  <tr key={s._id}>
                    <td>
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        <Avatar name={s.user?.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.user?.name || 'Noma\'lum'}</div>
                          <div className="text-muted" style={{ fontSize: '.78rem' }}>{s.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.lesson?.title || '—'}</div>
                      {s.lesson?.order != null && (
                        <div className="text-muted" style={{ fontSize: '.78rem' }}>{s.lesson.order}-dars</div>
                      )}
                    </td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(s.createdAt)}</td>
                    <td>{s.grade != null ? <b>{s.grade}/100</b> : '—'}</td>
                    <td>
                      <div className="row gap-2 wrap" style={{ justifyContent: 'flex-end' }}>
                        {s.submissionUrl && (
                          <a className="btn btn-ghost btn-sm" href={fileUrl(s.submissionUrl)} target="_blank" rel="noreferrer">
                            <ExternalLink /> Ko'rish
                          </a>
                        )}
                        {canReview && (
                          <Button variant="primary" size="sm" onClick={() => openReview(s)}>
                            <ClipboardCheck /> Baholash
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={closeReview}
        title="Topshiriqni baholash"
        footer={
          <>
            <Button variant="danger" onClick={() => submit('rejected')} loading={review.isPending && action === 'rejected'} disabled={review.isPending && action !== 'rejected'}>
              Rad etish
            </Button>
            <Button variant="success" onClick={() => submit('approved')} loading={review.isPending && action === 'approved'} disabled={review.isPending && action !== 'approved'}>
              Tasdiqlash
            </Button>
          </>
        }
      >
        {selected && (
          <div className="stack gap-4">
            <div className="card card-pad stack gap-2" style={{ background: 'var(--surface-2, var(--bg-soft))' }}>
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <Avatar name={selected.user?.name} size="sm" />
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{selected.user?.name}</div>
                  <div className="text-muted" style={{ fontSize: '.78rem' }}>{selected.lesson?.title}</div>
                </div>
              </div>
              {selected.submissionUrl && (
                <a className="btn btn-secondary btn-sm" href={fileUrl(selected.submissionUrl)} target="_blank" rel="noreferrer">
                  <ExternalLink /> Yuborilgan faylni ochish
                </a>
              )}
              {selected.submissionComment && (
                <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                  <MessageSquare style={{ width: 16, height: 16, flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                  <p className="text-secondary" style={{ fontSize: '.86rem' }}>{selected.submissionComment}</p>
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label"><Star style={{ width: 15, height: 15 }} /> Baho (0-100)</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0 - 100"
                  value={form.grade}
                  onChange={setField('grade')}
                  autoFocus
                />
              </div>
              <div className="field">
                <label className="label"><Coins style={{ width: 15, height: 15 }} /> Coinlar</label>
                <input
                  className="input"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.coins}
                  onChange={setField('coins')}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Izoh (feedback)</label>
              <textarea
                className="textarea"
                rows={4}
                placeholder="O'quvchiga izoh yozing..."
                value={form.feedback}
                onChange={setField('feedback')}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
