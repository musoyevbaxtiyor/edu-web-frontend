import { useMemo, useState } from 'react'
import {
  ClipboardList, Play, CheckCircle2, XCircle, Lightbulb, Award, HelpCircle, ListChecks,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { GridSkeleton } from '../components/Skeletons'
import { EmptyState, Button, Modal } from '../components/ui'
import { useTests, useCheckAnswer } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { DIFFICULTY } from '../lib/utils'

const DIFF_FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'easy', label: 'Oson' },
  { key: 'medium', label: "O'rta" },
  { key: 'hard', label: 'Qiyin' },
]

function DiffBadge({ difficulty }) {
  const d = DIFFICULTY[difficulty] || DIFFICULTY.medium
  return <span className={`badge ${d.badge}`}>{d.label}</span>
}

export default function Tests() {
  const toast = useToast()
  const { data: tests, isLoading } = useTests({ isActive: true })
  const check = useCheckAnswer()

  const [diff, setDiff] = useState('all')
  const [category, setCategory] = useState('all')
  const [solved, setSolved] = useState(() => new Set())

  // Quiz modal holati
  const [active, setActive] = useState(null) // joriy test obyekti
  const [selected, setSelected] = useState(null) // tanlangan variant indeksi
  const [result, setResult] = useState(null) // { isCorrect, correctAnswer, explanation, score }

  const categories = useMemo(() => {
    const set = new Set()
    ;(tests || []).forEach((t) => t.category && set.add(t.category))
    return Array.from(set)
  }, [tests])

  const list = useMemo(() => {
    let out = tests || []
    if (diff !== 'all') out = out.filter((t) => t.difficulty === diff)
    if (category !== 'all') out = out.filter((t) => t.category === category)
    return out
  }, [tests, diff, category])

  const openQuiz = (test) => {
    setActive(test)
    setSelected(null)
    setResult(null)
  }

  const closeQuiz = () => {
    setActive(null)
    setSelected(null)
    setResult(null)
  }

  const onCheck = async () => {
    if (active == null || selected == null) return
    try {
      const res = await check.mutateAsync({ id: active._id, answerIndex: selected })
      setResult(res)
      setSolved((prev) => new Set(prev).add(active._id))
      if (res.isCorrect) {
        toast.success(`To'g'ri javob! +${res.score ?? 0} ball`)
      } else {
        toast.error("Noto'g'ri javob. Izohni o'qib chiqing.")
      }
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Variant tugmasi ko'rinishini aniqlash
  const optionStyle = (idx) => {
    const base = {
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      textAlign: 'left', padding: '13px 15px', borderRadius: 'var(--r-md, 12px)',
      border: '1.5px solid var(--border)', background: 'var(--surface)',
      cursor: result ? 'default' : 'pointer', font: 'inherit', color: 'var(--text)',
      transition: 'border-color .15s, background .15s',
    }
    if (!result) {
      if (selected === idx) {
        return { ...base, borderColor: 'var(--brand-500)', background: 'var(--brand-50)' }
      }
      return base
    }
    // Natija ko'rsatilgandan keyin
    if (idx === result.correctAnswer) {
      return { ...base, borderColor: 'var(--success)', background: 'var(--success-soft)', color: 'var(--text)' }
    }
    if (idx === selected) {
      return { ...base, borderColor: 'var(--danger)', background: 'var(--danger-soft)', color: 'var(--text)' }
    }
    return { ...base, opacity: 0.6 }
  }

  return (
    <div>
      <PageHeader title="Testlar" subtitle="Bilimingizni sinab ko'ring" />

      <div className="between wrap gap-3" style={{ marginBottom: 22 }}>
        <div className="tabs">
          {DIFF_FILTERS.map((f) => (
            <button key={f.key} className={`tab ${diff === f.key ? 'active' : ''}`} onClick={() => setDiff(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <select className="select" style={{ maxWidth: 240 }} value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Test topilmadi"
          message="Tanlangan mezon bo'yicha hozircha testlar mavjud emas."
        />
      ) : (
        <div className="grid-cards">
          {list.map((test) => {
            const isSolved = solved.has(test._id)
            return (
              <div key={test._id} className="card card-pad card-hover stack gap-3" style={{ height: '100%' }}>
                <div className="between wrap gap-2">
                  <DiffBadge difficulty={test.difficulty} />
                  {isSolved && (
                    <span className="badge badge-success"><CheckCircle2 /> Yechilgan</span>
                  )}
                </div>

                {test.category && (
                  <span className="text-muted" style={{ fontSize: '.78rem', fontWeight: 600, letterSpacing: '.02em', textTransform: 'uppercase' }}>
                    {test.category}
                  </span>
                )}

                <h3 style={{ fontSize: '1.02rem', lineHeight: 1.4 }}>
                  {test.title || test.question}
                </h3>
                {test.title && test.question && (
                  <p className="text-secondary" style={{ fontSize: '.88rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {test.question}
                  </p>
                )}

                <div className="row gap-2 text-muted" style={{ fontSize: '.82rem', marginTop: 'auto' }}>
                  <ListChecks style={{ width: 16, height: 16 }} />
                  <span>{(test.options || []).length} ta variant</span>
                </div>

                <Button block variant={isSolved ? 'secondary' : 'primary'} onClick={() => openQuiz(test)}>
                  <Play /> {isSolved ? 'Qayta ishlash' : 'Boshlash'}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        open={!!active}
        onClose={closeQuiz}
        title={active?.title || 'Test savoli'}
        size={640}
        footer={
          result ? (
            <Button onClick={closeQuiz}>Yopish</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={closeQuiz}>Bekor qilish</Button>
              <Button onClick={onCheck} loading={check.isPending} disabled={selected == null}>
                <CheckCircle2 /> Tekshirish
              </Button>
            </>
          )
        }
      >
        {active && (
          <div className="stack gap-4">
            <div className="row gap-2 wrap">
              <DiffBadge difficulty={active.difficulty} />
              {active.category && <span className="badge badge-info">{active.category}</span>}
            </div>

            <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
              <HelpCircle style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--brand-500)', marginTop: 2 }} />
              <p style={{ fontWeight: 600, fontSize: '1.05rem', lineHeight: 1.5 }}>{active.question}</p>
            </div>

            {active.code && (
              <pre
                className="mono"
                style={{
                  background: 'var(--surface-3)', borderRadius: 'var(--r-md, 12px)',
                  padding: '14px 16px', overflow: 'auto', fontSize: '.85rem',
                  lineHeight: 1.6, border: '1px solid var(--border)', margin: 0,
                }}
              >
                <code>{active.code}</code>
              </pre>
            )}

            <div className="stack gap-2">
              {(active.options || []).map((opt, idx) => {
                const showCorrect = result && idx === result.correctAnswer
                const showWrong = result && idx === selected && idx !== result.correctAnswer
                return (
                  <button
                    key={idx}
                    type="button"
                    style={optionStyle(idx)}
                    disabled={!!result}
                    onClick={() => !result && setSelected(idx)}
                  >
                    <span
                      className="center"
                      style={{
                        width: 26, height: 26, flexShrink: 0, borderRadius: '50%', fontSize: '.8rem', fontWeight: 700,
                        border: '1.5px solid var(--border)',
                        background: showCorrect ? 'var(--success)' : showWrong ? 'var(--danger)' : selected === idx && !result ? 'var(--brand-500)' : 'transparent',
                        color: showCorrect || showWrong || (selected === idx && !result) ? '#fff' : 'var(--text-muted)',
                        borderColor: showCorrect ? 'var(--success)' : showWrong ? 'var(--danger)' : selected === idx && !result ? 'var(--brand-500)' : 'var(--border)',
                      }}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="grow">{opt}</span>
                    {showCorrect && <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--success)', flexShrink: 0 }} />}
                    {showWrong && <XCircle style={{ width: 20, height: 20, color: 'var(--danger)', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>

            {result && (
              <div className="stack gap-3">
                <div
                  className={`alert ${result.isCorrect ? 'alert-success' : 'alert-danger'}`}
                  style={{ borderRadius: 'var(--r-md, 12px)' }}
                >
                  {result.isCorrect ? <CheckCircle2 /> : <XCircle />}
                  <div className="grow">
                    <b>{result.isCorrect ? "To'g'ri javob!" : "Noto'g'ri javob"}</b>
                    {typeof result.score === 'number' && result.isCorrect && (
                      <span className="row gap-1" style={{ display: 'inline-flex', marginLeft: 8 }}>
                        <Award style={{ width: 15, height: 15 }} /> +{result.score} ball
                      </span>
                    )}
                  </div>
                </div>

                {(result.explanation || active.explanation) && (
                  <div className="card card-pad" style={{ background: 'var(--surface-2)' }}>
                    <div className="row gap-2" style={{ alignItems: 'flex-start' }}>
                      <Lightbulb style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--warning, #f59e0b)', marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Izoh</div>
                        <p className="text-secondary" style={{ fontSize: '.9rem', lineHeight: 1.6 }}>
                          {result.explanation || active.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
