import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, GraduationCap, ArrowRight } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import CourseCard from '../components/CourseCard'
import { GridSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/ui'
import { useMyCourses } from '../hooks/useApi'

export default function MyCourses() {
  const { data: courses, isLoading } = useMyCourses()
  const [q, setQ] = useState('')

  const list = useMemo(() => {
    const all = courses || []
    if (!q.trim()) return all
    const s = q.toLowerCase()
    return all.filter(
      (c) => c.title?.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s)
    )
  }, [courses, q])

  return (
    <div>
      <PageHeader title="Mening kurslarim" subtitle="Yozilgan kurslaringiz va davom etish" />

      {!isLoading && (courses || []).length > 0 && (
        <div className="input-group" style={{ maxWidth: 360, marginBottom: 22 }}>
          <Search />
          <input
            className="input"
            placeholder="Kurs qidirish..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : list.length === 0 ? (
        q ? (
          <EmptyState
            icon={Search}
            title="Kurs topilmadi"
            message="Qidiruv bo'yicha hech narsa topilmadi. Boshqa so'z bilan urinib ko'ring."
          />
        ) : (
          <EmptyState
            icon={GraduationCap}
            title="Hali kursga yozilmagansiz"
            message="Katalogdan qiziqarli kurs tanlab, o'qishni boshlang."
            action={
              <Link to="/courses" className="btn btn-primary">
                Kurslar katalogi
              </Link>
            }
          />
        )
      ) : (
        <div className="grid-cards">
          {list.map((c) => (
            <CourseCard
              key={c._id}
              course={c}
              to={`/learn/${c._id}`}
              enrolled
              footer={
                <Link to={`/learn/${c._id}`} className="btn btn-primary btn-block">
                  Davom etish <ArrowRight />
                </Link>
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
