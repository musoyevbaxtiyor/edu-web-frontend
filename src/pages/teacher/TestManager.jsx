import { useMemo, useState } from 'react'
import {
  Plus, ClipboardList, Pencil, Trash2, ListChecks, CheckCircle2,
  Code2, Search, X, HelpCircle,
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { GridSkeleton } from '../../components/Skeletons'
import { Button, Modal, ConfirmDialog, EmptyState } from '../../components/ui'
import {
  useTests, useCreateTest, useUpdateTest, useDeleteTest, useTeacherCourses,
} from '../../hooks/useApi'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { DIFFICULTY } from '../../lib/utils'

const EMPTY_FORM = {
  title: '',
  question: '',
  code: '',
  options: ['', ''],
  correctAnswer: 0,
  explanation: '',
  difficulty: 'easy',
  category: '',
  courseId: '',
  order: '',
}

const DIFF_FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'easy', label: 'Oson' },
  { key: 'medium', label: "O'rta" },
  { key: 'hard', label: 'Qiyin' },
]

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || ''

function DiffBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.medium
  return <span className={`badge ${d.badge}`}>{d.label}</span>
}

export default function TestManager() {
  const { user, role } = useAuth()
  const toast = useToast()
  const { data: tests, isLoading } = useTests()
  const { data: courses } = useTeacherCourses()

  const createTest = useCreateTest()
  const updateTest = useUpdateTest()
  const deleteTest = useDeleteTest()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [q, setQ] = useState('')
  const [diff, setDiff] = useState('all')

  const saving = createTest.isPending || updateTest.isPending

  // Faqat o'z testlari (admin uchun hammasi)
  const mine = useMemo(() => {
    const list = tests || []
    if (role === 'admin') return list
    return list.filter((t) => idOf(t.createdBy) === user?._id)
  }, [tests, role, user])

  const list = useMemo(() => {
    let out = mine
    if (diff !== 'all') out = out.filter((t) => t.difficulty === diff)
    if (q.trim()) {
      const s = q.toLowerCase()
      out = out.filter(
        (t) =>
          t.title?.toLowerCase().includes(s) ||
          t.question?.toLowerCase().includes(s) ||
          t.category?.toLowerCase().includes(s),
      )
    }
    return out
  }, [mine, diff, q])

  /* ---------- Form helpers ---------- */
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const setOption = (idx) => (e) =>
    setForm((f) => ({ ...f, options: f.options.map((o, i) => (i === idx ? e.target.value : o)) }))

  const setCorrect = (idx) => setForm((f) => ({ ...f, correctAnswer: idx }))

  const addOption = () =>
    setForm((f) => (f.options.length >= 6 ? f : { ...f, options: [...f.options, ''] }))

  const removeOption = (idx) =>
    setForm((f) => {
      if (f.options.length <= 2) return f
      const options = f.options.filter((_, i) => i !== idx)
      let correctAnswer = f.correctAnswer
      if (idx === f.correctAnswer) correctAnswer = 0
      else if (idx < f.correctAnswer) correctAnswer = f.correctAnswer - 1
      return { ...f, options, correctAnswer }
    })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (test) => {
    setEditing(test)
    setForm({
      title: test.title || '',
      question: test.question || '',
      code: test.code || '',
      options: Array.isArray(test.options) && test.options.length >= 2 ? [...test.options] : ['', ''],
      correctAnswer: Number(test.correctAnswer) || 0,
      explanation: test.explanation || '',
      difficulty: test.difficulty || 'easy',
      category: test.category || '',
      courseId: idOf(test.courseId),
      order: test.order != null ? String(test.order) : '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const onSubmit = async (e) => {
    e?.preventDefault?.()

    const title = form.title.trim()
    const question = form.question.trim()
    if (!title) return toast.error('Test sarlavhasini kiriting.')
    if (!question) return toast.error('Savol matnini kiriting.')

    const opts = form.options.map((o) => o.trim())
    if (!opts[form.correctAnswer]) return toast.error("To'g'ri javob variantini belgilang (bo'sh bo'lmasin).")

    // Bo'sh variantlarni olib tashlab, to'g'ri javob indeksini qayta hisoblash
    const finalOptions = []
    let correctAnswer = 0
    opts.forEach((o, i) => {
      if (!o) return
      if (i === form.correctAnswer) correctAnswer = finalOptions.length
      finalOptions.push(o)
    })
    if (finalOptions.length < 2) return toast.error("Kamida 2 ta variant kiriting.")

    const body = {
      title,
      question,
      options: finalOptions,
      correctAnswer,
      difficulty: form.difficulty,
    }
    const code = form.code.trim()
    const explanation = form.explanation.trim()
    const category = form.category.trim()
    if (code) body.code = code
    if (explanation) body.explanation = explanation
    if (category) body.category = category
    if (form.courseId) body.courseId = form.courseId
    if (String(form.order).trim() !== '') body.order = Number(form.order)

    try {
      if (editing) {
        await updateTest.mutateAsync({ id: editing._id, body })
        toast.success('Test yangilandi.')
      } else {
        await createTest.mutateAsync(body)
        toast.success('Yangi test yaratildi.')
      }
      closeModal()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTest.mutateAsync(deleteTarget._id)
      toast.success("Test o'chirildi.")
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Testlar boshqaruvi"
        subtitle="O'quvchilar bilimini sinash uchun testlar yarating va boshqaring."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Yangi test
          </Button>
        }
      />

      <div className="between wrap gap-3" style={{ marginBottom: 22 }}>
        <div className="input-group" style={{ maxWidth: 360, flex: 1 }}>
          <Search />
          <input
            className="input"
            placeholder="Test qidirish..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="tabs">
          {DIFF_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`tab ${diff === f.key ? 'active' : ''}`}
              onClick={() => setDiff(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={q || diff !== 'all' ? 'Test topilmadi' : 'Hali test yaratmagansiz'}
          message={
            q || diff !== 'all'
              ? "Tanlangan mezon bo'yicha test topilmadi. Boshqa filtrni sinab ko'ring."
              : "Birinchi testingizni yarating va o'quvchilar bilimini sinang."
          }
          action={
            !q && diff === 'all' ? (
              <Button onClick={openCreate}>
                <Plus /> Test yaratish
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid-cards">
          {list.map((test) => {
            const options = test.options || []
            const correctLetter = String.fromCharCode(65 + (Number(test.correctAnswer) || 0))
            return (
              <div key={test._id} className="card card-pad card-hover stack gap-3" style={{ height: '100%' }}>
                <div className="between wrap gap-2">
                  <DiffBadge difficulty={test.difficulty} />
                  {test.category && <span className="badge badge-info">{test.category}</span>}
                </div>

                <h3 style={{ fontSize: '1.02rem', lineHeight: 1.4 }}>{test.title || test.question}</h3>

                {test.title && test.question && (
                  <p
                    className="text-secondary"
                    style={{
                      fontSize: '.88rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {test.question}
                  </p>
                )}

                {test.code && (
                  <span className="badge"><Code2 /> Kod bloki</span>
                )}

                <div className="row gap-3 wrap text-muted" style={{ fontSize: '.82rem', marginTop: 'auto' }}>
                  <span className="row gap-1">
                    <ListChecks style={{ width: 16, height: 16 }} /> {options.length} ta variant
                  </span>
                  <span className="row gap-1">
                    <CheckCircle2 style={{ width: 16, height: 16, color: 'var(--success)' }} /> To'g'ri: {correctLetter}
                  </span>
                </div>

                <div className="row gap-2">
                  <Button variant="secondary" size="sm" block onClick={() => openEdit(test)}>
                    <Pencil /> Tahrirlash
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(test)}>
                    <Trash2 /> O'chirish
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Testni tahrirlash' : 'Yangi test'}
        size={640}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Bekor qilish</Button>
            <Button onClick={onSubmit} loading={saving}>{editing ? 'Saqlash' : 'Yaratish'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="stack gap-4">
          <div className="field">
            <label className="label">Test sarlavhasi</label>
            <input
              className="input"
              placeholder="Masalan: JavaScript o'zgaruvchilar"
              value={form.title}
              onChange={setField('title')}
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label">Savol</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Savol matnini kiriting..."
              value={form.question}
              onChange={setField('question')}
            />
          </div>

          <div className="field">
            <label className="label">Kod bloki (ixtiyoriy)</label>
            <textarea
              className="textarea mono"
              rows={4}
              style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '.85rem' }}
              placeholder="const x = 10;"
              value={form.code}
              onChange={setField('code')}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="label">Murakkablik</label>
              <select className="select" value={form.difficulty} onChange={setField('difficulty')}>
                <option value="easy">Oson</option>
                <option value="medium">O'rta</option>
                <option value="hard">Qiyin</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Kategoriya</label>
              <input
                className="input"
                placeholder="Masalan: JavaScript"
                value={form.category}
                onChange={setField('category')}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label className="label">Kurs (ixtiyoriy)</label>
              <select className="select" value={form.courseId} onChange={setField('courseId')}>
                <option value="">Bog'lanmagan</option>
                {(courses || []).map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="label">Tartib raqami (ixtiyoriy)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0"
                value={form.order}
                onChange={setField('order')}
              />
            </div>
          </div>

          <div className="field">
            <div className="between wrap gap-2">
              <label className="label">Variantlar</label>
              <span className="text-muted" style={{ fontSize: '.78rem' }}>
                <HelpCircle style={{ width: 13, height: 13, verticalAlign: '-2px' }} /> To'g'ri javobni belgilang
              </span>
            </div>
            <div className="stack gap-2">
              {form.options.map((opt, idx) => (
                <div key={idx} className="row gap-2" style={{ alignItems: 'center' }}>
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={form.correctAnswer === idx}
                    onChange={() => setCorrect(idx)}
                    title="To'g'ri javob"
                    style={{ width: 18, height: 18, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--success)' }}
                  />
                  <span
                    className="center text-muted"
                    style={{ width: 22, flexShrink: 0, fontWeight: 700, fontSize: '.85rem' }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    className="input"
                    placeholder={`${String.fromCharCode(65 + idx)} variant`}
                    value={opt}
                    onChange={setOption(idx)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-icon"
                    onClick={() => removeOption(idx)}
                    disabled={form.options.length <= 2}
                    aria-label="Variantni o'chirish"
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
            {form.options.length < 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                style={{ alignSelf: 'flex-start', marginTop: 6 }}
              >
                <Plus /> Variant qo'shish
              </Button>
            )}
          </div>

          <div className="field">
            <label className="label">Izoh (ixtiyoriy)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="To'g'ri javob nima uchun to'g'ri ekanini tushuntiring..."
              value={form.explanation}
              onChange={setField('explanation')}
            />
          </div>

          <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Testni o'chirish"
        message={
          deleteTarget
            ? `"${deleteTarget.title || deleteTarget.question}" testini o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.`
            : ''
        }
        loading={deleteTest.isPending}
      />
    </div>
  )
}
