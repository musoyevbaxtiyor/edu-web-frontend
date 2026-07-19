import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, PlayCircle, Lock, CheckCircle2, FileText, Download, Upload,
  BookOpen, ClipboardList, Clock, X, FileUp, Send,
} from 'lucide-react'
import { Button, EmptyState } from '../components/ui'
import { PageLoader } from '../components/ui/Spinner'
import { useCourse, useLessons, useStartLesson, useMySubmission, useSubmitTask } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { toEmbedUrl } from '../lib/utils'
import { fileUrl } from '../lib/api'
import './lesson.css'

const STATUS_BADGE = {
  approved: { cls: 'badge-success', label: 'Tasdiqlangan', icon: CheckCircle2 },
  completed: { cls: 'badge-success', label: 'Tugatilgan', icon: CheckCircle2 },
  submitted: { cls: 'badge-warning', label: 'Tekshirilmoqda', icon: Clock },
  in_review: { cls: 'badge-warning', label: 'Tekshirilmoqda', icon: Clock },
  rejected: { cls: 'badge-danger', label: 'Rad etilgan', icon: X },
}

function SubmissionPanel({ lesson, courseId }) {
  const toast = useToast()
  const { data: submission, isLoading } = useMySubmission(lesson._id)
  const submit = useSubmitTask()
  const [file, setFile] = useState(null)
  const [comment, setComment] = useState('')
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const status = submission?.status
  const locked = status === 'approved' || status === 'submitted' || status === 'in_review'

  const onFile = (f) => {
    if (!f) return
    if (f.size > 10 * 1024 * 1024) return toast.error('Fayl hajmi 10 MB dan oshmasligi kerak')
    setFile(f)
  }

  const onSubmit = async () => {
    if (!file) return toast.error('Iltimos, vazifa faylini tanlang')
    try {
      await submit.mutateAsync({ file, lessonId: lesson._id, courseId, submissionComment: comment })
      toast.success('Vazifa topshirildi! O\'qituvchi tekshiradi.')
      setFile(null); setComment('')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (isLoading) return <div className="skeleton" style={{ height: 120 }} />

  const badge = status && STATUS_BADGE[status]

  return (
    <div className="card card-pad">
      <div className="between" style={{ marginBottom: 16 }}>
        <h3 className="row gap-2" style={{ fontSize: '1.1rem' }}><ClipboardList style={{ width: 20, height: 20, color: 'var(--brand-500)' }} /> Vazifa topshirish</h3>
        {badge && <span className={`badge ${badge.cls}`}><badge.icon /> {badge.label}</span>}
      </div>

      {submission && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          <Clock />
          <div>
            <div style={{ fontWeight: 600 }}>Oxirgi topshiriq yuborilgan</div>
            {submission.submissionUrl && (
              <a href={fileUrl(submission.submissionUrl)} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-600)', fontWeight: 600, fontSize: '.85rem' }}>
                Yuborilgan faylni ko'rish
              </a>
            )}
            {submission.status === 'approved' && submission.grade != null && (
              <div style={{ fontSize: '.85rem', marginTop: 4 }}>Baho: <b>{submission.grade}/100</b>{submission.coins ? ` · +${submission.coins} coin` : ''}</div>
            )}
            {submission.status === 'rejected' && submission.feedback && (
              <div style={{ fontSize: '.85rem', marginTop: 4 }}>Izoh: {submission.feedback}</div>
            )}
          </div>
        </div>
      )}

      {status === 'approved' ? (
        <div className="alert alert-success"><CheckCircle2 /> Ushbu vazifa tasdiqlangan. Keyingi dars ochildi!</div>
      ) : locked ? (
        <div className="alert alert-warning"><Clock /> Vazifangiz tekshirilmoqda. Natijani kuting.</div>
      ) : (
        <div className="stack gap-3">
          {status === 'rejected' && <div className="alert alert-danger"><X /> Vazifa rad etildi. Iltimos, tuzatib qayta topshiring.</div>}
          <input ref={inputRef} type="file" hidden onChange={(e) => onFile(e.target.files[0])}
            accept=".jpg,.jpeg,.png,.pdf,.zip,.rar,.docx,.txt" />
          <div
            className={`dropzone ${drag ? 'drag' : ''} ${file ? 'has-file' : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]) }}
          >
            {file ? (
              <div className="row gap-3 center">
                <FileUp style={{ width: 28, height: 28, color: 'var(--success)' }} />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div className="text-muted" style={{ fontSize: '.8rem' }}>{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <Button variant="ghost" size="sm" className="btn-icon" onClick={(e) => { e.stopPropagation(); setFile(null) }}><X /></Button>
              </div>
            ) : (
              <div>
                <Upload style={{ width: 30, height: 30, color: 'var(--brand-500)', margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 600 }}>Faylni bu yerga tashlang yoki tanlang</div>
                <div className="text-muted" style={{ fontSize: '.8rem', marginTop: 4 }}>JPG, PNG, PDF, ZIP, RAR, DOCX, TXT · max 10 MB</div>
              </div>
            )}
          </div>
          <textarea className="textarea" style={{ minHeight: 80 }} placeholder="Izoh (ixtiyoriy)..." value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button onClick={onSubmit} loading={submit.isPending} disabled={!file}><Send /> Vazifani topshirish</Button>
        </div>
      )}
    </div>
  )
}

export default function LessonView() {
  const { courseId } = useParams()
  const { role } = useAuth()
  const { data: course } = useCourse(courseId)
  const { data: lessons, isLoading } = useLessons(courseId)
  const startLesson = useStartLesson()
  const [activeId, setActiveId] = useState(null)
  const startedRef = useRef(new Set())

  // Birinchi ochiq darsni tanlash
  useEffect(() => {
    if (!lessons?.length || activeId) return
    const firstOpen = lessons.find((l) => !l.isLocked) || lessons[0]
    setActiveId(firstOpen?._id)
  }, [lessons, activeId])

  const active = useMemo(() => lessons?.find((l) => l._id === activeId), [lessons, activeId])

  // Ochiq darsni ochilganda progressni 'started' ga o'tkazish (bir marta)
  useEffect(() => {
    if (!active || role !== 'student' || active.isLocked) return
    if (active.progressStatus && active.progressStatus !== 'locked') return
    if (startedRef.current.has(active._id)) return
    startedRef.current.add(active._id)
    startLesson.mutate({ lessonId: active._id, courseId })
  }, [active, role, courseId, startLesson])

  if (isLoading) return <PageLoader />

  return (
    <div>
      <div className="between wrap gap-3" style={{ marginBottom: 18 }}>
        <div>
          <Link to={role === 'student' ? '/my-courses' : '/courses'} className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}><ArrowLeft /> Orqaga</Link>
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>{course?.title || 'Kurs'}</h1>
        </div>
      </div>

      {!lessons?.length ? (
        <EmptyState icon={BookOpen} title="Darslar hali qo'shilmagan" message="O'qituvchi tez orada darslar qo'shadi." />
      ) : (
        <div className="lv">
          {/* Lessons sidebar */}
          <div className="lv-list">
            <div className="card card-pad">
              <div className="text-muted" style={{ fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>
                {lessons.length} ta dars
              </div>
              <div className="lv-list-scroll">
                {lessons.map((l) => {
                  const done = l.progressStatus === 'completed' || l.progressStatus === 'approved'
                  return (
                    <button key={l._id} className={`lv-item ${activeId === l._id ? 'active' : ''} ${l.isLocked ? 'locked' : ''}`}
                      onClick={() => !l.isLocked && setActiveId(l._id)} disabled={l.isLocked}>
                      <span className="lv-item-num">
                        {done ? <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)' }} /> : l.isLocked ? <Lock style={{ width: 14, height: 14 }} /> : l.order}
                      </span>
                      <span className="grow truncate" style={{ fontSize: '.9rem', fontWeight: 500 }}>{l.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Lesson content */}
          <div className="stack gap-4">
            {!active ? (
              <EmptyState icon={PlayCircle} title="Darsni tanlang" />
            ) : active.isLocked ? (
              <div className="card card-pad center" style={{ minHeight: 300, flexDirection: 'column', gap: 12, textAlign: 'center' }}>
                <div className="center" style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Lock /></div>
                <h3>Bu dars qulflangan</h3>
                <p className="text-muted" style={{ maxWidth: 360 }}>Avvalgi darsni tugatib, vazifasini topshiring va tasdiqlanishini kuting.</p>
              </div>
            ) : (
              <>
                <div>
                  <div className="row gap-2 wrap" style={{ marginBottom: 12 }}>
                    <span className="badge badge-brand">{active.order}-dars</span>
                    {(active.progressStatus === 'completed' || active.progressStatus === 'approved') && <span className="badge badge-success"><CheckCircle2 /> Tugatilgan</span>}
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', fontWeight: 800 }}>{active.title}</h2>
                </div>

                {/* Video */}
                {active.videoUrl && (
                  <div className="lv-video">
                    <iframe src={toEmbedUrl(active.videoUrl)} title={active.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                )}

                {/* Documentation */}
                {active.documentationUrl && (
                  <a href={active.documentationUrl} target="_blank" rel="noreferrer" className="lv-resource">
                    <span className="lv-resource-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}><BookOpen style={{ width: 22, height: 22 }} /></span>
                    <div className="grow">
                      <div style={{ fontWeight: 600 }}>Dars dokumentatsiyasi</div>
                      <div className="text-muted" style={{ fontSize: '.82rem' }}>Qo'shimcha o'quv materiali — yangi oynada ochiladi</div>
                    </div>
                    <ArrowLeft style={{ width: 18, height: 18, transform: 'rotate(135deg)', color: 'var(--text-muted)' }} />
                  </a>
                )}

                {/* Task */}
                {active.taskDescription && (
                  <div className="card card-pad">
                    <h3 className="row gap-2" style={{ fontSize: '1.1rem', marginBottom: 10 }}><FileText style={{ width: 20, height: 20, color: 'var(--brand-500)' }} /> Vazifa</h3>
                    <p className="text-secondary" style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{active.taskDescription}</p>
                    {active.taskFileUrl && (
                      <a href={active.taskFileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop: 14 }}>
                        <Download /> Vazifa faylini yuklab olish
                      </a>
                    )}
                  </div>
                )}

                {/* Submission (faqat student) */}
                {role === 'student' && active.taskDescription && (
                  <SubmissionPanel lesson={active} courseId={courseId} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
