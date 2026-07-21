import { useMemo, useState } from 'react'
import {
  Plus, Pencil, Trash2, ListChecks, Eye, EyeOff, ClipboardCheck, ExternalLink,
  Star, MessageSquare, Paperclip, Link2, Inbox,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { RowsSkeleton } from '../../components/Skeletons'
import { Button, Modal, EmptyState, ConfirmDialog, Avatar } from '../../components/ui'
import {
  usePracticeManageTasks, useCreatePracticeTask, useUpdatePracticeTask, useDeletePracticeTask,
  usePracticeSubmissions, useReviewPractice,
} from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import {
  PRACTICE_CATEGORIES, PRACTICE_CATEGORY_KEYS, PRACTICE_LEVELS, formatDateTime,
} from '../../lib/utils'
import { fileUrl } from '../../lib/api'

const TABS = [
  { key: 'tasks', label: 'Tasklar' },
  { key: 'submissions', label: 'Topshiriqlar' },
]

const BLANK = () => ({ title: '', description: '', resourceUrl: '', category: 'html', level: 'easy', order: '', isActive: true })

/* ==================== TASK MUHARRIRI ==================== */
function TaskEditor({ task, onClose }) {
  const toast = useToast()
  const isNew = !task._id
  const create = useCreatePracticeTask()
  const update = useUpdatePracticeTask()
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    resourceUrl: task.resourceUrl || '',
    category: task.category || 'html',
    level: task.level || 'easy',
    order: task.order ?? '',
    isActive: task.isActive !== false,
  })
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    if (!form.title.trim()) return toast.error('Task sarlavhasini kiriting.')
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      resourceUrl: form.resourceUrl.trim(),
      category: form.category,
      level: form.level,
      order: form.order === '' ? undefined : Number(form.order),
      isActive: form.isActive,
    }
    try {
      if (isNew) await create.mutateAsync(body)
      else await update.mutateAsync({ id: task._id, body })
      toast.success(isNew ? 'Task yaratildi.' : 'Task yangilandi.')
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={isNew ? 'Yangi amaliy task' : 'Taskni tahrirlash'} size={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor</Button>
          <Button loading={create.isPending || update.isPending} onClick={save}>Saqlash</Button>
        </>
      }>
      <div className="stack gap-3">
        <div className="field">
          <label className="label">Sarlavha</label>
          <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Masalan: Semantik HTML sahifa yasang" autoFocus />
        </div>
        <div className="field">
          <label className="label">Tavsif</label>
          <textarea className="textarea" style={{ minHeight: 70 }} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Task nima qilinishini yozing..." />
        </div>
        <div className="field">
          <label className="label">Namuna / topshiriq havolasi (ixtiyoriy)</label>
          <input className="input" value={form.resourceUrl} onChange={(e) => set({ resourceUrl: e.target.value })} placeholder="https://... (Figma, rasm, hujjat)" />
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <div className="field">
            <label className="label">Kategoriya</label>
            <select className="select" value={form.category} onChange={(e) => set({ category: e.target.value })}>
              {PRACTICE_CATEGORY_KEYS.map((k) => <option key={k} value={k}>{PRACTICE_CATEGORIES[k].label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label">Daraja</label>
            <select className="select" value={form.level} onChange={(e) => set({ level: e.target.value })}>
              <option value="easy">Easy</option>
              <option value="middle">Middle</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Tartib raqami</label>
            <input className="input" type="number" min="1" value={form.order} onChange={(e) => set({ order: e.target.value })} placeholder="auto" />
          </div>
        </div>
        <label className="row gap-2" style={{ cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
          <span style={{ fontSize: '.9rem' }}>Faol (o'quvchilarga ko'rinadi)</span>
        </label>
      </div>
    </Modal>
  )
}

/* ==================== TASKLAR RO'YXATI ==================== */
function TasksPanel() {
  const { data: tasks, isLoading } = usePracticeManageTasks()
  const update = useUpdatePracticeTask()
  const del = useDeletePracticeTask()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [filter, setFilter] = useState('all')

  const list = useMemo(() => {
    let out = tasks || []
    if (filter !== 'all') out = out.filter((t) => t.category === filter)
    return out
  }, [tasks, filter])

  const toggleActive = async (t) => {
    try {
      await update.mutateAsync({ id: t._id, body: { isActive: !t.isActive } })
      toast.success(t.isActive ? 'Task yashirildi.' : 'Task faollashtirildi.')
    } catch (e) { toast.error(e.message) }
  }

  const doDelete = async () => {
    try {
      await del.mutateAsync(toDelete._id)
      toast.success('Task o\'chirildi.')
      setToDelete(null)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <div className="between wrap gap-3" style={{ marginBottom: 18 }}>
        <div className="tabs">
          <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Barchasi</button>
          {PRACTICE_CATEGORY_KEYS.map((k) => (
            <button key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{PRACTICE_CATEGORIES[k].short}</button>
          ))}
        </div>
        <Button onClick={() => setEditing(BLANK())}><Plus /> Yangi task</Button>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={5} />
      ) : !list.length ? (
        <EmptyState icon={ListChecks} title="Hali task yo'q"
          message="Birinchi amaliy taskingizni qo'shing — kategoriya va darajani tanlang."
          action={<Button onClick={() => setEditing(BLANK())}><Plus /> Task qo'shish</Button>} />
      ) : (
        <div className="stack gap-3">
          {list.map((t) => {
            const cat = PRACTICE_CATEGORIES[t.category]
            const lvl = PRACTICE_LEVELS[t.level]
            return (
              <div key={t._id} className="card card-pad row gap-3 wrap">
                <span className="center" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, fontWeight: 800, background: cat?.soft, color: cat?.color }}>{cat?.short}</span>
                <div className="grow" style={{ minWidth: 200 }}>
                  <div className="row gap-2 wrap" style={{ marginBottom: 4 }}>
                    <span className={`badge ${lvl?.badge}`}>{lvl?.label}</span>
                    <span className="badge badge-brand">{t.order}-task</span>
                    {!t.isActive && <span className="badge">Yashirilgan</span>}
                    {t.pendingCount > 0 && <span className="badge badge-warning">{t.pendingCount} yangi</span>}
                  </div>
                  <div style={{ fontWeight: 700 }}>{t.title}</div>
                  {t.description && <div className="text-muted" style={{ fontSize: '.82rem', marginTop: 2 }}>{t.description}</div>}
                </div>
                <div className="row gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(t)} title={t.isActive ? 'Yashirish' : 'Faollashtirish'}>
                    {t.isActive ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(t)}><Pencil /> Tahrirlash</Button>
                  <Button variant="ghost" size="sm" className="btn-icon" onClick={() => setToDelete(t)}><Trash2 /></Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editing && <TaskEditor task={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={doDelete} loading={del.isPending}
        title="Taskni o'chirish" message={`"${toDelete?.title}" taski va uning barcha topshiriqlari o'chiriladi.`} />
    </div>
  )
}

/* ==================== TOPSHIRIQLARNI BAHOLASH ==================== */
const SUB_STATUS = {
  submitted: { cls: 'badge-warning', label: 'Tekshirilmoqda' },
  in_review: { cls: 'badge-warning', label: 'Tekshirilmoqda' },
  approved: { cls: 'badge-success', label: 'Tasdiqlangan' },
  rejected: { cls: 'badge-danger', label: 'Rad etilgan' },
}

function SubmissionsPanel() {
  const toast = useToast()
  const [tab, setTab] = useState('pending')
  const pending = usePracticeSubmissions('pending')
  const all = usePracticeSubmissions('all')
  const review = useReviewPractice()
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ grade: '', feedback: '' })
  const [action, setAction] = useState(null)

  const active = tab === 'pending' ? pending : all
  const list = active.data || []

  const openReview = (s) => {
    setSelected(s)
    setForm({ grade: s.grade ?? '', feedback: s.feedback || '' })
  }
  const closeReview = () => { if (!review.isPending) { setSelected(null); setAction(null) } }

  const submit = async (status) => {
    if (!selected) return
    if (status === 'approved' && form.grade !== '' && (Number(form.grade) < 0 || Number(form.grade) > 100)) {
      return toast.error('Baho 0 dan 100 gacha bo\'lishi kerak.')
    }
    setAction(status)
    try {
      await review.mutateAsync({
        submissionId: selected._id,
        status,
        grade: form.grade === '' ? 0 : Number(form.grade),
        feedback: form.feedback.trim(),
      })
      toast.success(status === 'approved' ? 'Tasdiqlandi — ball reytingga qo\'shildi.' : 'Rad etildi.')
      setSelected(null)
    } catch (e) {
      toast.error(e.message)
    } finally { setAction(null) }
  }

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 22 }}>
        <button className={`tab ${tab === 'pending' ? 'active' : ''}`} onClick={() => setTab('pending')}>
          Tekshirilmagan{pending.data?.length ? ` (${pending.data.length})` : ''}
        </button>
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>Barchasi</button>
      </div>

      {active.isLoading ? (
        <RowsSkeleton rows={6} />
      ) : !list.length ? (
        <EmptyState icon={Inbox} title="Topshiriq yo'q"
          message={tab === 'pending' ? 'Hozircha tekshirishni kutayotgan topshiriq yo\'q.' : 'Hali birorta amaliy task topshirilmagan.'} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>O'quvchi</th>
                <th>Task</th>
                <th>Status</th>
                <th>Sana</th>
                <th>Baho</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const st = SUB_STATUS[s.status] || SUB_STATUS.submitted
                const cat = PRACTICE_CATEGORIES[s.task?.category]
                const lvl = PRACTICE_LEVELS[s.task?.level]
                const canReview = s.status === 'submitted' || s.status === 'in_review'
                return (
                  <tr key={s._id}>
                    <td>
                      <div className="row gap-2" style={{ alignItems: 'center' }}>
                        <Avatar name={s.student?.name} size="sm" />
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.student?.name || 'Noma\'lum'}</div>
                          <div className="text-muted" style={{ fontSize: '.78rem' }}>{s.student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.task?.title || '—'}</div>
                      <div className="row gap-1 wrap" style={{ marginTop: 3 }}>
                        {cat && <span className="badge" style={{ background: cat.soft, color: cat.color, border: 'none' }}>{cat.short}</span>}
                        {lvl && <span className={`badge ${lvl.badge}`}>{lvl.label}</span>}
                      </div>
                    </td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(s.createdAt)}</td>
                    <td>{s.grade != null ? <b>{s.grade}/100</b> : '—'}</td>
                    <td>
                      <div className="row gap-2 wrap" style={{ justifyContent: 'flex-end' }}>
                        {s.submissionLink && (
                          <a className="btn btn-ghost btn-sm" href={s.submissionLink} target="_blank" rel="noreferrer"><Link2 /> Havola</a>
                        )}
                        {s.submissionFile && (
                          <a className="btn btn-ghost btn-sm" href={fileUrl(s.submissionFile)} target="_blank" rel="noreferrer"><Paperclip /> Fayl</a>
                        )}
                        {canReview && (
                          <Button variant="primary" size="sm" onClick={() => openReview(s)}><ClipboardCheck /> Baholash</Button>
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

      <Modal open={!!selected} onClose={closeReview} title="Amaliy taskni baholash"
        footer={
          <>
            <Button variant="danger" onClick={() => submit('rejected')} loading={review.isPending && action === 'rejected'} disabled={review.isPending && action !== 'rejected'}>Rad etish</Button>
            <Button variant="success" onClick={() => submit('approved')} loading={review.isPending && action === 'approved'} disabled={review.isPending && action !== 'approved'}>Tasdiqlash</Button>
          </>
        }>
        {selected && (
          <div className="stack gap-4">
            <div className="card card-pad stack gap-2" style={{ background: 'var(--surface-2)' }}>
              <div className="row gap-2" style={{ alignItems: 'center' }}>
                <Avatar name={selected.student?.name} size="sm" />
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{selected.student?.name}</div>
                  <div className="text-muted" style={{ fontSize: '.78rem' }}>{selected.task?.title}</div>
                </div>
              </div>
              <div className="row gap-2 wrap">
                {selected.submissionLink && (
                  <a className="btn btn-secondary btn-sm" href={selected.submissionLink} target="_blank" rel="noreferrer"><ExternalLink /> Havolani ochish</a>
                )}
                {selected.submissionFile && (
                  <a className="btn btn-secondary btn-sm" href={fileUrl(selected.submissionFile)} target="_blank" rel="noreferrer"><Paperclip /> Faylni ochish</a>
                )}
              </div>
              {selected.submissionComment && (
                <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                  <MessageSquare style={{ width: 16, height: 16, flexShrink: 0, marginTop: 3, color: 'var(--text-muted)' }} />
                  <p style={{ fontSize: '.86rem' }}>{selected.submissionComment}</p>
                </div>
              )}
            </div>

            <div className="field">
              <label className="label"><Star style={{ width: 15, height: 15 }} /> Baho (0-100) — reytingga qo'shiladi</label>
              <input className="input" type="number" min="0" max="100" placeholder="0 - 100" value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} autoFocus />
            </div>
            <div className="field">
              <label className="label">Izoh (feedback)</label>
              <textarea className="textarea" rows={4} placeholder="O'quvchiga izoh yozing..." value={form.feedback} onChange={(e) => setForm((f) => ({ ...f, feedback: e.target.value }))} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

/* ==================== ASOSIY ==================== */
export default function PracticeManager() {
  const [tab, setTab] = useState('tasks')
  const pendingCount = usePracticeSubmissions('pending').data?.length || 0

  return (
    <div>
      <PageHeader title="Amaliy tasklar" subtitle="Qo'shimcha tayyorlanish uchun amaliy vazifalar qo'shing va topshiriqlarni baholang." />

      <div className="tabs" style={{ marginBottom: 22 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}{t.key === 'submissions' && pendingCount ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {tab === 'tasks' ? <TasksPanel /> : <SubmissionsPanel />}
    </div>
  )
}
