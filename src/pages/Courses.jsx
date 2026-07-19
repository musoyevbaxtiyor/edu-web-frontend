import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BookOpen, Sparkles } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import CourseCard from '../components/CourseCard'
import { GridSkeleton } from '../components/Skeletons'
import { EmptyState, Button } from '../components/ui'
import { useCourses, useMyCourses, useEnroll } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'free', label: 'Bepul' },
  { key: 'paid', label: 'Pullik' },
]

export default function Courses() {
  const { role } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { data: courses, isLoading } = useCourses()
  const { data: myCourses } = useMyCourses()
  const enroll = useEnroll()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [enrolling, setEnrolling] = useState(null)

  const enrolledIds = useMemo(() => new Set((myCourses || []).map((c) => c._id)), [myCourses])

  const list = useMemo(() => {
    let out = (courses || []).filter((c) => role !== 'student' || c.isPublished !== false)
    if (q.trim()) {
      const s = q.toLowerCase()
      out = out.filter((c) => c.title?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s))
    }
    if (filter === 'free') out = out.filter((c) => !c.price)
    if (filter === 'paid') out = out.filter((c) => c.price > 0)
    return out
  }, [courses, q, filter, role])

  const onEnroll = async (course) => {
    setEnrolling(course._id)
    try {
      await enroll.mutateAsync(course._id)
      toast.success(`"${course.title}" kursiga yozildingiz!`)
      navigate(`/learn/${course._id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnrolling(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Kurslar katalogi"
        subtitle="O'zingizga mos kursni tanlab, bilim olishni boshlang."
      />

      <div className="between wrap gap-3" style={{ marginBottom: 22 }}>
        <div className="input-group" style={{ maxWidth: 360, flex: 1 }}>
          <Search />
          <input className="input" placeholder="Kurs qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={`tab ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : list.length === 0 ? (
        <EmptyState icon={q ? Search : BookOpen} title="Kurs topilmadi"
          message={q ? "Qidiruv bo'yicha hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring." : "Hozircha kurslar mavjud emas."} />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {list.map((course) => {
            const isEnrolled = enrolledIds.has(course._id)
            return (
              <CourseCard
                key={course._id}
                course={course}
                enrolled={isEnrolled}
                badge={!course.price && <span className="badge" style={{ background: 'rgba(255,255,255,0.92)', color: 'var(--brand-700)', border: 'none' }}><Sparkles /> Bepul</span>}
                footer={
                  role === 'student' ? (
                    isEnrolled ? (
                      <Button variant="secondary" block onClick={() => navigate(`/learn/${course._id}`)}>Davom etish</Button>
                    ) : (
                      <Button block loading={enrolling === course._id} onClick={() => onEnroll(course)}>Kursga yozilish</Button>
                    )
                  ) : (
                    <Button variant="secondary" block onClick={() => navigate(`/courses/${course._id}`)}>Batafsil</Button>
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
