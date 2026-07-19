import { useEffect, useMemo, useRef, useState } from 'react'
import {
  GraduationCap, Clock, ListChecks, Play, RotateCcw, ArrowLeft, ArrowRight,
  CheckCircle2, XCircle, Trophy, Timer, Lightbulb, Award, Flag,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { GridSkeleton } from '../components/Skeletons'
import { Button, EmptyState } from '../components/ui'
import { PageLoader } from '../components/ui/Spinner'
import { useExams, useExam, useMyExamResults, useSubmitExam } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { EXAM_LEVELS } from '../lib/utils'
import './exams.css'

const LEVEL_TONE = { easy: 'var(--grad-mint)', middle: 'linear-gradient(135deg,#f59e0b,#fbbf24)', pro: 'var(--grad-sunset)' }
const FILTERS = [{ key: 'all', label: 'Barchasi' }, { key: 'easy', label: 'Oson' }, { key: 'middle', label: "O'rta" }, { key: 'pro', label: 'Pro' }]

function fmtTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/* ============ Ro'yxat ============ */
function ExamsList({ onStart }) {
  const { data: exams, isLoading } = useExams()
  const { data: resultsData } = useMyExamResults(true)
  const [filter, setFilter] = useState('all')

  const best = resultsData?.best || {}

  const list = useMemo(() => {
    let out = (exams || []).slice()
    if (filter !== 'all') out = out.filter((e) => e.level === filter)
    out.sort((a, b) => (EXAM_LEVELS[a.level]?.order || 9) - (EXAM_LEVELS[b.level]?.order || 9))
    return out
  }, [exams, filter])

  return (
    <div>
      <PageHeader title="Imtihonlar" subtitle="Bilimingizni to'liq imtihon orqali sinab ko'ring va natijangizni oling." />

      <div className="tabs" style={{ marginBottom: 22 }}>
        {FILTERS.map((f) => (
          <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
      </div>

      {isLoading ? (
        <GridSkeleton count={3} />
      ) : list.length === 0 ? (
        <EmptyState icon={GraduationCap} title="Imtihon topilmadi" message="Bu daraja bo'yicha hozircha imtihon mavjud emas." />
      ) : (
        <div className="grid-cards">
          {list.map((exam) => {
            const lvl = EXAM_LEVELS[exam.level] || EXAM_LEVELS.easy
            const b = best[exam._id]
            return (
              <div key={exam._id} className="card card-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 84, background: LEVEL_TONE[exam.level], display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12 }}>
                  <span className="center" style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.22)', color: '#fff', flexShrink: 0 }}>
                    <GraduationCap />
                  </span>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>{lvl.short}</span>
                  {b && (
                    <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.92)', color: b.passed ? 'var(--success)' : 'var(--danger)', border: 'none' }}>
                      {b.passed ? <CheckCircle2 /> : <XCircle />} {b.scorePercent}%
                    </span>
                  )}
                </div>
                <div className="card-pad stack gap-3 grow">
                  <div className="grow">
                    <div className="row gap-2 wrap" style={{ marginBottom: 8 }}>
                      <span className={`badge ${lvl.badge}`}>{lvl.label}</span>
                      <span className="badge badge-brand">{exam.category}</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: 6 }}>{exam.title}</h3>
                    <p className="text-muted" style={{ fontSize: '.86rem' }}>{exam.description}</p>
                  </div>
                  <div className="row gap-4 text-muted" style={{ fontSize: '.82rem' }}>
                    <span className="row gap-1"><ListChecks style={{ width: 15, height: 15 }} /> {exam.questionCount} savol</span>
                    <span className="row gap-1"><Clock style={{ width: 15, height: 15 }} /> {exam.durationMinutes} daqiqa</span>
                  </div>
                  <Button block variant={b ? 'secondary' : 'primary'} onClick={() => onStart(exam._id)}>
                    {b ? <><RotateCcw /> Qayta topshirish</> : <><Play /> Imtihonni boshlash</>}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ============ Natija ============ */
function ExamResult({ exam, result, onRetry, onExit }) {
  const ringColor = result.passed ? 'var(--success)' : 'var(--danger)'
  return (
    <div>
      <Button variant="ghost" size="sm" onClick={onExit} style={{ marginBottom: 16 }}><ArrowLeft /> Imtihonlar</Button>

      <div className="card card-pad text-center" style={{ maxWidth: 640, margin: '0 auto 20px' }}>
        <div className="exam-score-ring" style={{ '--pct': `${result.scorePercent}%`, '--ring-color': ringColor }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: ringColor }}>{result.scorePercent}%</div>
            <div className="text-muted" style={{ fontSize: '.78rem' }}>{result.correctCount}/{result.totalQuestions} to'g'ri</div>
          </div>
        </div>
        <h2 style={{ marginTop: 18, fontSize: '1.4rem' }}>{result.passed ? "Tabriklaymiz! O'tdingiz 🎉" : "Afsuski, o'ta olmadingiz"}</h2>
        <p className="text-muted" style={{ marginTop: 6 }}>
          {exam.title} · o'tish uchun kerak: {result.passScore}%
        </p>
        <div className="row gap-3 center wrap" style={{ marginTop: 20 }}>
          <Button variant="secondary" onClick={onRetry}><RotateCcw /> Qayta urinish</Button>
          <Button onClick={onExit}><Trophy /> Imtihonlarga qaytish</Button>
        </div>
      </div>

      {/* Review */}
      <div className="stack gap-4" style={{ maxWidth: 780, margin: '0 auto' }}>
        <h3 style={{ fontSize: '1.15rem' }}>Javoblar tahlili</h3>
        {exam.questions.map((q, i) => {
          const r = result.review[i] || {}
          return (
            <div key={q._id || i} className="card card-pad">
              <div className="row gap-2" style={{ alignItems: 'flex-start', marginBottom: 10 }}>
                <span className="center" style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, background: r.isCorrect ? 'var(--success-soft)' : 'var(--danger-soft)', color: r.isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                  {r.isCorrect ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <XCircle style={{ width: 16, height: 16 }} />}
                </span>
                <p style={{ fontWeight: 600 }}>{i + 1}. {q.question}</p>
              </div>
              {q.code && <pre className="exam-q-code">{q.code}</pre>}
              <div className="stack gap-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === r.correctAnswer
                  const isYours = oi === r.yourAnswer
                  const cls = isCorrect ? 'correct' : isYours ? 'wrong' : ''
                  return (
                    <div key={oi} className={`exam-opt ${cls}`} style={{ cursor: 'default' }}>
                      <span className="exam-opt-key">{String.fromCharCode(65 + oi)}</span>
                      <span className="grow">{opt}</span>
                      {isCorrect && <CheckCircle2 style={{ width: 18, height: 18, color: 'var(--success)' }} />}
                      {isYours && !isCorrect && <XCircle style={{ width: 18, height: 18, color: 'var(--danger)' }} />}
                    </div>
                  )
                })}
              </div>
              {q.explanation && (
                <div className="alert alert-info" style={{ marginTop: 12 }}>
                  <Lightbulb />
                  <div><b>Izoh:</b> {q.explanation}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ============ Imtihon topshirish ============ */
function ExamRunner({ examId, onExit }) {
  const toast = useToast()
  const { data: exam, isLoading } = useExam(examId)
  const submit = useSubmitExam()
  const [answers, setAnswers] = useState([])
  const [current, setCurrent] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [result, setResult] = useState(null)
  const submittedRef = useRef(false)

  const total = exam?.questions?.length || 0

  useEffect(() => {
    if (exam) {
      setAnswers(new Array(exam.questions.length).fill(-1))
      setTimeLeft((exam.durationMinutes || 15) * 60)
    }
  }, [exam])

  const doSubmit = useRef(null)
  const finish = async () => {
    if (submittedRef.current) return
    submittedRef.current = true
    try {
      const res = await submit.mutateAsync({ id: examId, answers })
      setResult(res)
    } catch (err) {
      submittedRef.current = false
      toast.error(err.message)
    }
  }
  doSubmit.current = finish

  // Taymer
  useEffect(() => {
    if (timeLeft == null || result) return
    if (timeLeft <= 0) { doSubmit.current?.(); return }
    const id = setInterval(() => setTimeLeft((t) => (t <= 1 ? 0 : t - 1)), 1000)
    return () => clearInterval(id)
  }, [timeLeft, result])

  if (isLoading || !exam) return <PageLoader />

  if (result) {
    return (
      <ExamResult
        exam={exam}
        result={result}
        onExit={onExit}
        onRetry={() => { setResult(null); setAnswers(new Array(total).fill(-1)); setCurrent(0); setTimeLeft((exam.durationMinutes || 15) * 60); submittedRef.current = false }}
      />
    )
  }

  const q = exam.questions[current]
  const answeredCount = answers.filter((a) => a >= 0).length
  const pick = (oi) => setAnswers((a) => a.map((v, i) => (i === current ? oi : v)))

  return (
    <div>
      <div className="between wrap gap-3" style={{ marginBottom: 18 }}>
        <div>
          <Button variant="ghost" size="sm" onClick={onExit} style={{ marginBottom: 6 }}><ArrowLeft /> Chiqish</Button>
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>{exam.title}</h1>
        </div>
        <span className={`exam-timer ${timeLeft != null && timeLeft <= 30 ? 'warn' : ''}`}>
          <Timer style={{ width: 18, height: 18 }} /> {timeLeft != null ? fmtTime(timeLeft) : '--:--'}
        </span>
      </div>

      <div className="exam-run">
        {/* Savol */}
        <div className="card card-pad">
          <div className="between" style={{ marginBottom: 14 }}>
            <span className="badge badge-brand">Savol {current + 1} / {total}</span>
            <span className="text-muted" style={{ fontSize: '.82rem' }}>{answeredCount} ta belgilandi</span>
          </div>

          <p style={{ fontWeight: 600, fontSize: '1.08rem', lineHeight: 1.5 }}>{q.question}</p>
          {q.code && <pre className="exam-q-code">{q.code}</pre>}

          <div className="stack gap-2" style={{ marginTop: 16 }}>
            {q.options.map((opt, oi) => (
              <button key={oi} type="button" className={`exam-opt ${answers[current] === oi ? 'selected' : ''}`} onClick={() => pick(oi)}>
                <span className="exam-opt-key">{String.fromCharCode(65 + oi)}</span>
                <span className="grow">{opt}</span>
              </button>
            ))}
          </div>

          <div className="between" style={{ marginTop: 20 }}>
            <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}><ArrowLeft /> Oldingi</Button>
            {current < total - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)}>Keyingi <ArrowRight /></Button>
            ) : (
              <Button variant="success" loading={submit.isPending} onClick={finish}><Flag /> Yakunlash</Button>
            )}
          </div>
        </div>

        {/* Navigator */}
        <div className="card card-pad">
          <h3 style={{ fontSize: '.95rem', marginBottom: 12 }}>Savollar</h3>
          <div className="exam-nav-grid">
            {exam.questions.map((_, i) => (
              <button key={i} className={`exam-nav-btn ${answers[i] >= 0 ? 'answered' : ''} ${i === current ? 'current' : ''}`} onClick={() => setCurrent(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="divider" />
          <div className="row gap-2 text-muted" style={{ fontSize: '.82rem', marginBottom: 6 }}>
            <span className="center" style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--brand-50)', border: '1.5px solid var(--brand-300)' }} /> Belgilangan
          </div>
          <Button block variant="success" loading={submit.isPending} onClick={finish} style={{ marginTop: 10 }}>
            <Flag /> Imtihonni yakunlash
          </Button>
          <p className="text-muted text-center" style={{ fontSize: '.76rem', marginTop: 8 }}>
            {answeredCount}/{total} savolga javob berildi
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Exams() {
  const [runningId, setRunningId] = useState(null)
  if (runningId) return <ExamRunner examId={runningId} onExit={() => setRunningId(null)} />
  return <ExamsList onStart={setRunningId} />
}
