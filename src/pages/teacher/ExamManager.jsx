import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, GraduationCap, ListChecks, Clock, ArrowLeft,
  Save, X, CircleDot, Check, Eye, EyeOff,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { RowsSkeleton } from '../../components/Skeletons'
import { Button, EmptyState, ConfirmDialog } from '../../components/ui'
import { useExams, useExam, useCreateExam, useUpdateExam, useDeleteExam } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { EXAM_LEVELS } from '../../lib/utils'

const BLANK_Q = () => ({ question: '', code: '', options: ['', ''], correctAnswer: 0, explanation: '' })
const BLANK_FORM = () => ({
  title: '', description: '', level: 'easy', category: 'HTML/CSS',
  durationMinutes: 15, passScore: 60, isActive: true, questions: [BLANK_Q()],
})

/* ---------- Savol muharriri ---------- */
function QuestionEditor({ q, index, onChange, onRemove, canRemove }) {
  const set = (patch) => onChange({ ...q, ...patch })
  const setOption = (oi, val) => set({ options: q.options.map((o, i) => (i === oi ? val : o)) })
  const addOption = () => q.options.length < 6 && set({ options: [...q.options, ''] })
  const removeOption = (oi) => {
    if (q.options.length <= 2) return
    const options = q.options.filter((_, i) => i !== oi)
    let correctAnswer = q.correctAnswer
    if (oi === correctAnswer) correctAnswer = 0
    else if (oi < correctAnswer) correctAnswer -= 1
    set({ options, correctAnswer })
  }

  return (
    <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
      <div className="between" style={{ marginBottom: 12 }}>
        <span className="badge badge-brand">{index + 1}-savol</span>
        {canRemove && <Button variant="ghost" size="sm" className="btn-icon" onClick={onRemove}><Trash2 /></Button>}
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label className="label">Savol matni</label>
        <textarea className="textarea" style={{ minHeight: 60 }} value={q.question} onChange={(e) => set({ question: e.target.value })} placeholder="Savolni yozing..." />
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label className="label">Kod (ixtiyoriy)</label>
        <textarea className="textarea mono" style={{ minHeight: 50, fontSize: '.85rem' }} value={q.code} onChange={(e) => set({ code: e.target.value })} placeholder="Masalan: .box { margin: 20px; }" />
      </div>

      <label className="label" style={{ marginBottom: 6 }}>Variantlar (to'g'risini belgilang)</label>
      <div className="stack gap-2">
        {q.options.map((opt, oi) => (
          <div key={oi} className="row gap-2">
            <button type="button" className="btn-icon" title="To'g'ri javob" onClick={() => set({ correctAnswer: oi })}
              style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, border: '1.5px solid', borderColor: q.correctAnswer === oi ? 'var(--success)' : 'var(--border)', background: q.correctAnswer === oi ? 'var(--success-soft)' : 'var(--surface)', color: q.correctAnswer === oi ? 'var(--success)' : 'var(--text-muted)' }}>
              {q.correctAnswer === oi ? <Check style={{ width: 18, height: 18 }} /> : <CircleDot style={{ width: 18, height: 18 }} />}
            </button>
            <input className="input" value={opt} onChange={(e) => setOption(oi, e.target.value)} placeholder={`${String.fromCharCode(65 + oi)} varianti`} />
            {q.options.length > 2 && <Button variant="ghost" size="sm" className="btn-icon" onClick={() => removeOption(oi)}><X /></Button>}
          </div>
        ))}
      </div>
      {q.options.length < 6 && (
        <Button variant="ghost" size="sm" onClick={addOption} style={{ marginTop: 8 }}><Plus /> Variant qo'shish</Button>
      )}

      <div className="field" style={{ marginTop: 12 }}>
        <label className="label">Izoh (javobdan keyin ko'rsatiladi)</label>
        <textarea className="textarea" style={{ minHeight: 44 }} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} placeholder="To'g'ri javob izohi..." />
      </div>
    </div>
  )
}

/* ---------- Muharrir (yaratish/tahrirlash) ---------- */
function ExamEditor({ examId, onDone }) {
  const toast = useToast()
  const isNew = examId === 'new'
  const { data: existing, isLoading } = useExam(isNew ? null : examId)
  const create = useCreateExam()
  const update = useUpdateExam()
  const [form, setForm] = useState(BLANK_FORM())

  useEffect(() => {
    if (existing && !isNew) {
      setForm({
        title: existing.title || '',
        description: existing.description || '',
        level: existing.level || 'easy',
        category: existing.category || 'HTML/CSS',
        durationMinutes: existing.durationMinutes || 15,
        passScore: existing.passScore ?? 60,
        isActive: existing.isActive !== false,
        questions: (existing.questions || []).map((q) => ({
          question: q.question || '', code: q.code || '', options: q.options || ['', ''],
          correctAnswer: q.correctAnswer ?? 0, explanation: q.explanation || '',
        })),
      })
    }
  }, [existing, isNew])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setQuestion = (i, q) => set({ questions: form.questions.map((x, idx) => (idx === i ? q : x)) })
  const addQuestion = () => set({ questions: [...form.questions, BLANK_Q()] })
  const removeQuestion = (i) => set({ questions: form.questions.filter((_, idx) => idx !== i) })

  const validate = () => {
    if (!form.title.trim()) return 'Imtihon sarlavhasini kiriting.'
    if (!form.questions.length) return 'Kamida 1 ta savol qo\'shing.'
    for (const [i, q] of form.questions.entries()) {
      if (!q.question.trim()) return `${i + 1}-savol matni bo'sh.`
      const opts = q.options.map((o) => o.trim())
      if (opts.filter(Boolean).length < 2) return `${i + 1}-savolda kamida 2 ta variant bo'lishi kerak.`
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length || !opts[q.correctAnswer]) return `${i + 1}-savolda to'g'ri javob belgilanmagan.`
    }
    return null
  }

  const save = async () => {
    const err = validate()
    if (err) return toast.error(err)
    const body = {
      ...form,
      durationMinutes: Number(form.durationMinutes) || 15,
      passScore: Number(form.passScore) || 60,
      questions: form.questions.map((q) => ({
        question: q.question.trim(), code: q.code.trim(),
        options: q.options.map((o) => o.trim()).filter(Boolean),
        correctAnswer: q.correctAnswer, explanation: q.explanation.trim(),
      })),
    }
    try {
      if (isNew) await create.mutateAsync(body)
      else await update.mutateAsync({ id: examId, body })
      toast.success(isNew ? 'Imtihon yaratildi.' : 'Imtihon yangilandi.')
      onDone()
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (!isNew && isLoading) return <RowsSkeleton rows={4} />

  return (
    <div>
      <div className="between wrap gap-3" style={{ marginBottom: 20 }}>
        <div>
          <Button variant="ghost" size="sm" onClick={onDone} style={{ marginBottom: 6 }}><ArrowLeft /> Imtihonlar</Button>
          <h1 className="page-title" style={{ fontSize: '1.4rem' }}>{isNew ? 'Yangi imtihon' : 'Imtihonni tahrirlash'}</h1>
        </div>
        <Button loading={create.isPending || update.isPending} onClick={save}><Save /> Saqlash</Button>
      </div>

      {/* Meta */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="label">Sarlavha</label>
          <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Masalan: HTML & CSS — Boshlang'ich" />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label className="label">Tavsif</label>
          <textarea className="textarea" style={{ minHeight: 50 }} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Imtihon haqida qisqa ma'lumot" />
        </div>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14 }}>
          <div className="field">
            <label className="label">Daraja</label>
            <select className="select" value={form.level} onChange={(e) => set({ level: e.target.value })}>
              <option value="easy">Oson (Easy)</option>
              <option value="middle">O'rta (Middle)</option>
              <option value="pro">Pro</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Kategoriya</label>
            <input className="input" value={form.category} onChange={(e) => set({ category: e.target.value })} />
          </div>
          <div className="field">
            <label className="label">Davomiyligi (daq)</label>
            <input className="input" type="number" min="1" value={form.durationMinutes} onChange={(e) => set({ durationMinutes: e.target.value })} />
          </div>
          <div className="field">
            <label className="label">O'tish balli (%)</label>
            <input className="input" type="number" min="0" max="100" value={form.passScore} onChange={(e) => set({ passScore: e.target.value })} />
          </div>
        </div>
        <label className="row gap-2" style={{ marginTop: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
          <span style={{ fontSize: '.9rem' }}>Faol (talabalarga ko'rinadi)</span>
        </label>
      </div>

      {/* Questions */}
      <div className="between" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: '1.1rem' }}>Savollar ({form.questions.length})</h2>
        <Button variant="secondary" size="sm" onClick={addQuestion}><Plus /> Savol qo'shish</Button>
      </div>
      <div className="stack gap-4">
        {form.questions.map((q, i) => (
          <QuestionEditor key={i} q={q} index={i} onChange={(nq) => setQuestion(i, nq)} onRemove={() => removeQuestion(i)} canRemove={form.questions.length > 1} />
        ))}
      </div>
      <Button variant="secondary" onClick={addQuestion} block style={{ marginTop: 16 }}><Plus /> Yana savol qo'shish</Button>
    </div>
  )
}

/* ---------- Ro'yxat ---------- */
export default function ExamManager() {
  const { data: exams, isLoading } = useExams({ mine: 'true' })
  const del = useDeleteExam()
  const update = useUpdateExam()
  const toast = useToast()
  const [editing, setEditing] = useState(null)
  const [toDelete, setToDelete] = useState(null)

  if (editing) return <ExamEditor examId={editing} onDone={() => setEditing(null)} />

  const toggleActive = async (exam) => {
    try {
      await update.mutateAsync({ id: exam._id, body: { isActive: !exam.isActive } })
      toast.success(exam.isActive ? 'Imtihon yashirildi.' : 'Imtihon faollashtirildi.')
    } catch (e) { toast.error(e.message) }
  }

  const doDelete = async () => {
    try {
      await del.mutateAsync(toDelete._id)
      toast.success('Imtihon o\'chirildi.')
      setToDelete(null)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div>
      <PageHeader
        title="Imtihonlar boshqaruvi"
        subtitle="Ko'p savolli imtihonlar yarating va boshqaring."
        actions={<Button onClick={() => setEditing('new')}><Plus /> Yangi imtihon</Button>}
      />

      {isLoading ? (
        <RowsSkeleton rows={4} />
      ) : !exams?.length ? (
        <EmptyState icon={GraduationCap} title="Hali imtihon yaratmagansiz"
          message="Birinchi imtihoningizni yarating — ko'p savolli, darajali."
          action={<Button onClick={() => setEditing('new')}><Plus /> Imtihon yaratish</Button>} />
      ) : (
        <div className="stack gap-3">
          {exams.map((exam) => {
            const lvl = EXAM_LEVELS[exam.level] || EXAM_LEVELS.easy
            return (
              <div key={exam._id} className="card card-pad row gap-3 wrap">
                <span className="center" style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: 'var(--grad-brand)', color: '#fff' }}><GraduationCap /></span>
                <div className="grow" style={{ minWidth: 200 }}>
                  <div className="row gap-2 wrap" style={{ marginBottom: 4 }}>
                    <span className={`badge ${lvl.badge}`}>{lvl.label}</span>
                    {!exam.isActive && <span className="badge">Yashirilgan</span>}
                  </div>
                  <div style={{ fontWeight: 700 }}>{exam.title}</div>
                  <div className="row gap-4 text-muted" style={{ fontSize: '.8rem', marginTop: 2 }}>
                    <span className="row gap-1"><ListChecks style={{ width: 14, height: 14 }} /> {exam.questionCount} savol</span>
                    <span className="row gap-1"><Clock style={{ width: 14, height: 14 }} /> {exam.durationMinutes} daq</span>
                  </div>
                </div>
                <div className="row gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(exam)} title={exam.isActive ? 'Yashirish' : 'Faollashtirish'}>
                    {exam.isActive ? <EyeOff /> : <Eye />}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(exam._id)}><Pencil /> Tahrirlash</Button>
                  <Button variant="ghost" size="sm" className="btn-icon" onClick={() => setToDelete(exam)}><Trash2 /></Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={doDelete} loading={del.isPending}
        title="Imtihonni o'chirish" message={`"${toDelete?.title}" imtihoni va uning barcha natijalari o'chiriladi.`} />
    </div>
  )
}
