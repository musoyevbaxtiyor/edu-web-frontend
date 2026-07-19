import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  BookOpen, User, PlayCircle, CheckCircle2, Lock, ArrowLeft, Coins,
  Clock, ClipboardList, GraduationCap, ArrowRight,
} from 'lucide-react'
import { Button, EmptyState } from '../components/ui'
import { PageLoader } from '../components/ui/Spinner'
import { useCourse, useLessons, useMyCourses, useEnroll } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatPrice } from '../lib/utils'

export default function CourseDetail() {
  const { id } = useParams()
  const { role } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { data: course, isLoading } = useCourse(id)
  const { data: myCourses } = useMyCourses()
  const enroll = useEnroll()
  const [enrolling, setEnrolling] = useState(false)

  const isEnrolled = useMemo(() => (myCourses || []).some((c) => c._id === id), [myCourses, id])
  const canViewLessons = isEnrolled || role === 'teacher' || role === 'admin'
  const { data: lessons } = useLessons(canViewLessons ? id : null)

  if (isLoading) return <PageLoader />
  if (!course) return <EmptyState icon={BookOpen} title="Kurs topilmadi" action={<Link to="/courses" className="btn btn-primary">Katalogga qaytish</Link>} />

  const onEnroll = async () => {
    setEnrolling(true)
    try {
      await enroll.mutateAsync(course._id)
      toast.success('Kursga muvaffaqiyatli yozildingiz!')
      navigate(`/learn/${course._id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div>
      <Link to="/courses" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}><ArrowLeft /> Katalog</Link>

      {/* Hero */}
      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ background: 'var(--grad-brand)', padding: 'clamp(28px, 5vw, 48px)', color: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 300px at 90% 0%, rgba(255,255,255,0.16), transparent 60%)' }} />
          <div style={{ position: 'relative', maxWidth: 720 }}>
            <div className="row gap-2 wrap" style={{ marginBottom: 16 }}>
              {!course.price ? <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>Bepul</span>
                : <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}>{formatPrice(course.price)}</span>}
              {isEnrolled && <span className="badge" style={{ background: 'rgba(255,255,255,0.9)', color: 'var(--success)', border: 'none' }}><CheckCircle2 /> Yozilgansiz</span>}
            </div>
            <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.1 }}>{course.title}</h1>
            <p style={{ opacity: 0.92, marginTop: 14, fontSize: '1.05rem', lineHeight: 1.6 }}>{course.description}</p>
            <div className="row gap-4 wrap" style={{ marginTop: 22, opacity: 0.95 }}>
              <span className="row gap-2"><User style={{ width: 18, height: 18 }} /> {course.teacher?.name || "O'qituvchi"}</span>
              {lessons && <span className="row gap-2"><PlayCircle style={{ width: 18, height: 18 }} /> {lessons.length} ta dars</span>}
            </div>
          </div>
        </div>

        <div className="card-pad between wrap gap-3">
          <div className="row gap-2 text-muted" style={{ fontSize: '.9rem' }}>
            <Clock style={{ width: 16, height: 16 }} /> O'z sur'atingizda o'rganing
          </div>
          {role === 'student' ? (
            isEnrolled ? (
              <Button size="lg" onClick={() => navigate(`/learn/${course._id}`)}>
                <PlayCircle /> Darsni davom ettirish
              </Button>
            ) : (
              <Button size="lg" loading={enrolling} onClick={onEnroll}>
                <GraduationCap /> Kursga yozilish {course.price > 0 && `— ${formatPrice(course.price)}`}
              </Button>
            )
          ) : (
            <Button size="lg" onClick={() => navigate(`/learn/${course._id}`)}>
              <PlayCircle /> Darslarni ko'rish
            </Button>
          )}
        </div>
      </div>

      {/* Curriculum */}
      <div className="grid-sidebar">
        <div className="card card-pad">
          <h2 style={{ fontSize: '1.25rem', marginBottom: 4 }}>Kurs dasturi</h2>
          <p className="text-muted" style={{ fontSize: '.9rem', marginBottom: 18 }}>
            {canViewLessons ? 'Darslar ketma-ket ochiladi.' : "Darslar ro'yxatini ko'rish uchun kursga yoziling."}
          </p>

          {canViewLessons && lessons ? (
            lessons.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Darslar hali qo'shilmagan" message="O'qituvchi tez orada darslar qo'shadi." />
            ) : (
              <div className="stack gap-2">
                {lessons.map((lesson, i) => {
                  const locked = lesson.isLocked
                  const done = lesson.progressStatus === 'completed' || lesson.progressStatus === 'approved'
                  return (
                    <div key={lesson._id} className="row gap-3" style={{ padding: '12px 14px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                      <span className="center" style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: done ? 'var(--success-soft)' : locked ? 'var(--surface-3)' : 'var(--brand-50)', color: done ? 'var(--success)' : locked ? 'var(--text-muted)' : 'var(--brand-600)' }}>
                        {done ? <CheckCircle2 style={{ width: 18, height: 18 }} /> : locked ? <Lock style={{ width: 16, height: 16 }} /> : <PlayCircle style={{ width: 18, height: 18 }} />}
                      </span>
                      <div className="grow">
                        <div style={{ fontWeight: 600, fontSize: '.94rem' }}>{lesson.order}. {lesson.title}</div>
                        {lesson.taskDescription && !locked && <div className="text-muted truncate" style={{ fontSize: '.8rem' }}>{lesson.taskDescription}</div>}
                      </div>
                      {!locked && (
                        <Link to={`/learn/${course._id}`} className="btn btn-ghost btn-sm btn-icon"><ArrowRight /></Link>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            <div className="stack gap-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="row gap-3" style={{ padding: '14px', borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', opacity: 0.75 }}>
                  <span className="center" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--surface-3)', color: 'var(--text-muted)' }}><Lock style={{ width: 16, height: 16 }} /></span>
                  <div className="skeleton" style={{ height: 12, width: `${60 - n * 6}%` }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side */}
        <div className="card card-pad stack gap-4">
          <h3 style={{ fontSize: '1.05rem' }}>Nima olasiz</h3>
          {[
            { icon: PlayCircle, t: 'Video darslar' },
            { icon: ClipboardList, t: 'Amaliy vazifalar' },
            { icon: Coins, t: 'Ball va coin mukofotlar' },
            { icon: CheckCircle2, t: 'Yakuniy sertifikat' },
          ].map((x) => (
            <div key={x.t} className="row gap-3">
              <span className="center" style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--grad-brand-soft)', color: 'var(--brand-600)' }}><x.icon style={{ width: 19, height: 19 }} /></span>
              <span style={{ fontWeight: 500, fontSize: '.92rem' }}>{x.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
