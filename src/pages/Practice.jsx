import { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, XCircle, Link2, Paperclip,
  ExternalLink, Send, RotateCcw, ListChecks,
} from 'lucide-react'
import { GridSkeleton, RowsSkeleton } from '../components/Skeletons'
import { Button, EmptyState, Modal } from '../components/ui'
import { usePracticeOverview, usePracticeTasks, useSubmitPractice } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import {
  PRACTICE_CATEGORIES, PRACTICE_CATEGORY_KEYS,
  PRACTICE_LEVELS, PRACTICE_LEVEL_KEYS, PRACTICE_STATUS, pct,
} from '../lib/utils'
import { fileUrl } from '../lib/api'
import './practice.css'

/* ============ 1) Kategoriyalar (TaskFlow bosh sahifa) ============ */
function Categories({ overview, isLoading, onOpen }) {
  const byCat = useMemo(() => {
    const map = {}
    for (const c of overview || []) map[c.category] = c
    return map
  }, [overview])

  return (
    <div>
      <div className="tf-hero">
        <div className="tf-hero-title">TaskFlow</div>
        <p className="tf-hero-sub">HTML, CSS, Figma va JavaScript bo'yicha amaliy vazifalar to'plami</p>
      </div>

      {isLoading ? (
        <GridSkeleton count={4} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {PRACTICE_CATEGORY_KEYS.map((key) => {
            const meta = PRACTICE_CATEGORIES[key]
            const c = byCat[key] || { total: 0, completed: 0 }
            const p = pct(c.completed, c.total)
            return (
              <button key={key} type="button" className="card card-hover card-pad tf-card stack gap-3" style={{ textAlign: 'left' }} onClick={() => onOpen(key)}>
                <span className="tf-icon" style={{ background: meta.soft, color: meta.color }}>{meta.short}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{meta.label}</div>
                  <p className="text-muted" style={{ fontSize: '.84rem', marginTop: 4 }}>{meta.desc}</p>
                </div>
                <div className="tf-bar" style={{ marginTop: 4 }}>
                  <span style={{ width: `${p}%`, background: meta.color }} />
                </div>
                <div className="text-muted" style={{ fontSize: '.8rem' }}>{p}% bajarildi</div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ============ 2) Darajalar ============ */
function Levels({ category, overview, onBack, onOpen }) {
  const meta = PRACTICE_CATEGORIES[category]
  const catData = (overview || []).find((c) => c.category === category)
  const levels = catData?.levels || []
  const byLevel = {}
  for (const l of levels) byLevel[l.level] = l

  return (
    <div>
      <button className="tf-back" onClick={onBack}><ArrowLeft style={{ width: 16, height: 16 }} /> Bosh sahifa</button>
      <h1 className="tf-page-title">{meta.label.replace(' Tasklar', '').replace(' Loyihalar', '')} — Tasklar</h1>
      <p className="text-muted" style={{ marginTop: 6, marginBottom: 24 }}>Darajani tanlang va vazifalarni bajarishni boshlang</p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {PRACTICE_LEVEL_KEYS.map((lk) => {
          const lmeta = PRACTICE_LEVELS[lk]
          const l = byLevel[lk] || { total: 0, completed: 0 }
          const p = pct(l.completed, l.total)
          return (
            <button key={lk} type="button" className="card card-hover card-pad tf-card stack gap-3" style={{ textAlign: 'left' }} onClick={() => onOpen(lk)}>
              <span className="tf-icon" style={{ background: lmetaSoft(lmeta.color), color: lmeta.color }}>{lmeta.short}</span>
              <div style={{ fontWeight: 800, fontSize: '1.3rem' }}>{lmeta.label}</div>
              <div className="text-muted" style={{ fontSize: '.85rem' }}>{l.completed}/{l.total} vazifa bajarildi</div>
              <div className="tf-bar">
                <span style={{ width: `${p}%`, background: lmeta.color }} />
              </div>
              <div className="text-muted" style={{ fontSize: '.85rem' }}>{p}%</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// yordamchi: daraja rangidan yumshoq fon (hex -> rgba)
function lmetaSoft(color) {
  // hex -> rgba(.16)
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return 'var(--surface-3)'
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0.16)`
}

/* ============ 3) Tasklar ro'yxati ============ */
function Tasks({ category, level, onBack }) {
  const { data: tasks, isLoading } = usePracticeTasks(category, level)
  const [active, setActive] = useState(null)
  const meta = PRACTICE_CATEGORIES[category]
  const lmeta = PRACTICE_LEVELS[level]

  const list = tasks || []
  const done = list.filter((t) => t.mySubmission?.status === 'approved').length
  const p = pct(done, list.length)

  return (
    <div>
      <button className="tf-back" onClick={onBack}><ArrowLeft style={{ width: 16, height: 16 }} /> Ortga</button>
      <h1 className="tf-page-title" style={{ marginBottom: 12 }}>
        {meta.label.replace(' Tasklar', '').replace(' Loyihalar', '')} · {lmeta.label}
      </h1>

      <div className="tf-bar" style={{ maxWidth: 460 }}>
        <span style={{ width: `${p}%`, background: 'var(--grad-brand)' }} />
      </div>
      <div className="text-muted" style={{ fontSize: '.85rem', margin: '8px 0 24px' }}>
        {done}/{list.length} bajarildi ({p}%)
      </div>

      {isLoading ? (
        <RowsSkeleton rows={5} />
      ) : list.length === 0 ? (
        <EmptyState icon={ListChecks} title="Hozircha task yo'q"
          message="Bu daraja bo'yicha o'qituvchi hali task qo'shmagan. Tez orada paydo bo'ladi." />
      ) : (
        <div className="stack gap-3">
          {list.map((t, i) => {
            const sub = t.mySubmission
            const st = sub ? PRACTICE_STATUS[sub.status] : null
            const isDone = sub?.status === 'approved'
            return (
              <button key={t._id} type="button" className={`tf-task-row ${isDone ? 'is-done' : ''}`} style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }} onClick={() => setActive(t)}>
                <span className="tf-task-num">{isDone ? <CheckCircle2 style={{ width: 18, height: 18 }} /> : t.order || i + 1}</span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <div className="tf-task-title">{t.title}</div>
                  {sub?.status === 'rejected' && sub.feedback && (
                    <div className="text-muted" style={{ fontSize: '.78rem', marginTop: 2 }}>Izoh: {sub.feedback}</div>
                  )}
                </div>
                {isDone ? (
                  <span className="badge badge-success" style={{ flexShrink: 0 }}><CheckCircle2 style={{ width: 14, height: 14 }} /> {sub.grade}/100</span>
                ) : st ? (
                  <span className={`badge ${st.badge}`} style={{ flexShrink: 0 }}>
                    {sub.status === 'rejected' ? <XCircle style={{ width: 14, height: 14 }} /> : <Clock style={{ width: 14, height: 14 }} />} {st.label}
                  </span>
                ) : (
                  <span className="badge" style={{ flexShrink: 0 }}>Topshirish <ArrowRight style={{ width: 13, height: 13 }} /></span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {active && <SubmitModal task={active} onClose={() => setActive(null)} />}
    </div>
  )
}

/* ============ Topshirish modal oynasi ============ */
function SubmitModal({ task, onClose }) {
  const toast = useToast()
  const submit = useSubmitPractice()
  const sub = task.mySubmission
  const [link, setLink] = useState(sub?.submissionLink || '')
  const [comment, setComment] = useState(sub?.submissionComment || '')
  const [file, setFile] = useState(null)
  const fileRef = useRef(null)

  const isDone = sub?.status === 'approved'

  const send = async () => {
    if (!link.trim() && !file) return toast.error('Havola yoki fayl kiriting.')
    try {
      await submit.mutateAsync({ taskId: task._id, submissionLink: link.trim(), submissionComment: comment.trim(), file })
      toast.success('Task topshirildi! O\'qituvchi tekshiradi.')
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <Modal open onClose={onClose} title={task.title} size={560}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Yopish</Button>
          {!isDone && (
            <Button loading={submit.isPending} onClick={send}>
              {sub ? <><RotateCcw /> Qayta topshirish</> : <><Send /> Topshirish</>}
            </Button>
          )}
        </>
      }>
      {task.description && <p className="text-muted" style={{ marginBottom: 14 }}>{task.description}</p>}

      {task.resourceUrl && (
        <a href={task.resourceUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginBottom: 16 }}>
          <ExternalLink /> Topshiriq / namuna
        </a>
      )}

      {/* Joriy holat */}
      {sub && (
        <div className={`alert ${sub.status === 'approved' ? 'alert-success' : sub.status === 'rejected' ? 'alert-danger' : 'alert-info'}`} style={{ marginBottom: 16 }}>
          {sub.status === 'approved' ? <CheckCircle2 /> : sub.status === 'rejected' ? <XCircle /> : <Clock />}
          <div>
            <b>
              {sub.status === 'approved' ? `Tasdiqlandi — ${sub.grade}/100 ball` : sub.status === 'rejected' ? 'Rad etildi' : 'Tekshirilmoqda'}
            </b>
            {sub.feedback && <div style={{ fontSize: '.84rem', marginTop: 2 }}>O'qituvchi izohi: {sub.feedback}</div>}
          </div>
        </div>
      )}

      {isDone ? (
        <p className="text-muted" style={{ fontSize: '.86rem' }}>
          Bu task tasdiqlangan va balingiz reytingga qo'shilgan. 🎉
        </p>
      ) : (
        <div className="stack gap-3">
          <div className="field">
            <label className="label"><Link2 style={{ width: 15, height: 15, verticalAlign: '-2px' }} /> Ish havolasi (GitHub / CodePen / Figma / jonli demo)</label>
            <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
          </div>

          <div className="field">
            <label className="label"><Paperclip style={{ width: 15, height: 15, verticalAlign: '-2px' }} /> Yoki fayl yuklang (ixtiyoriy)</label>
            <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.pdf,.zip,.rar,.html,.htm,.css,.js,.json,.txt,.docx" />
            <div className="row gap-2 wrap">
              <Button variant="secondary" size="sm" type="button" onClick={() => fileRef.current?.click()}><Paperclip /> Fayl tanlash</Button>
              {file && <span className="text-muted" style={{ fontSize: '.82rem' }}>{file.name}</span>}
              {!file && sub?.submissionFile && (
                <a href={fileUrl(sub.submissionFile)} target="_blank" rel="noreferrer" className="text-muted" style={{ fontSize: '.82rem' }}>Oldingi fayl</a>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label">Izoh (ixtiyoriy)</label>
            <textarea className="textarea" style={{ minHeight: 56 }} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Qisqacha izoh..." />
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ============ Asosiy sahifa ============ */
export default function Practice() {
  const { data: overview, isLoading } = usePracticeOverview()
  const [category, setCategory] = useState(null)
  const [level, setLevel] = useState(null)

  if (category && level) {
    return <Tasks category={category} level={level} onBack={() => setLevel(null)} />
  }
  if (category) {
    return <Levels category={category} overview={overview} onBack={() => setCategory(null)} onOpen={setLevel} />
  }
  return <Categories overview={overview} isLoading={isLoading} onOpen={setCategory} />
}
