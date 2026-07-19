import { Link } from 'react-router-dom'
import {
  BookOpen, GraduationCap, TrendingUp, Coins, Trophy, Award, Bell,
  FolderKanban, FileCheck2, ClipboardList, Users, Layers, Plus, ArrowRight,
  CheckCircle2, Clock, Sparkles,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import CourseCard from '../components/CourseCard'
import { StatsSkeleton, GridSkeleton } from '../components/Skeletons'
import { EmptyState } from '../components/ui'
import {
  useStatistics, useMyScores, useMyCourses, useTeacherCourses,
  useTeacherSubmissions, useNotifications, useAllUsers, useCourses,
} from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../lib/utils'

function Welcome({ name, sub }) {
  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 24, background: 'var(--grad-brand)', border: 'none' }}>
      <div className="card-pad" style={{ position: 'relative', color: '#fff' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(500px 260px at 92% 0%, rgba(255,255,255,0.18), transparent 60%)' }} />
        <div style={{ position: 'relative' }}>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', marginBottom: 12 }}>
            <Sparkles /> {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800 }}>Salom, {name}! 👋</h1>
          <p style={{ opacity: 0.92, marginTop: 8, maxWidth: 560 }}>{sub}</p>
        </div>
      </div>
    </div>
  )
}

/* ---------------- STUDENT ---------------- */
function StudentDashboard({ user }) {
  const { data: stats, isLoading } = useStatistics(true)
  const { data: scores } = useMyScores(true)
  const { data: myCourses, isLoading: loadingCourses } = useMyCourses()
  const { data: notifications } = useNotifications()

  return (
    <div>
      <Welcome name={user.name} sub="Bugun bilimingizni yana bir pog'ona yuqori ko'taring. Davom etamizmi?" />

      {isLoading ? <StatsSkeleton /> : (
        <div className="grid-stats">
          <StatCard icon={BookOpen} tone="brand" value={stats?.courses ?? 0} label="Kurslarim" />
          <StatCard icon={CheckCircle2} tone="mint" value={stats?.completed ?? 0} label="Tugatilgan" />
          <StatCard icon={TrendingUp} tone="info" value={`${stats?.progress ?? 0}%`} label="O'rtacha progress" />
          <StatCard icon={Coins} tone="gold" value={stats?.coins ?? 0} label="Coinlar" />
        </div>
      )}

      <div className="grid-sidebar" style={{ marginTop: 26 }}>
        <div>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: '1.2rem' }}>O'qishni davom ettiring</h2>
            <Link to="/my-courses" className="btn btn-ghost btn-sm">Barchasi <ArrowRight /></Link>
          </div>
          {loadingCourses ? <GridSkeleton count={2} /> : !myCourses?.length ? (
            <EmptyState icon={GraduationCap} title="Hali kursga yozilmagansiz"
              message="Katalogdan qiziqarli kurs tanlab, o'qishni boshlang."
              action={<Link to="/courses" className="btn btn-primary">Kurslarni ko'rish</Link>} />
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {myCourses.slice(0, 4).map((c) => (
                <CourseCard key={c._id} course={c} to={`/learn/${c._id}`} enrolled
                  footer={<Link to={`/learn/${c._id}`} className="btn btn-primary btn-block">Davom etish <ArrowRight /></Link>} />
              ))}
            </div>
          )}
        </div>

        <div className="stack gap-4">
          {/* Rank */}
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div className="center" style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 12px', background: 'var(--grad-sunset)', color: '#fff' }}><Trophy /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800 }}>#{scores?.rank ?? '—'}</div>
            <div className="text-muted" style={{ fontSize: '.85rem' }}>Umumiy reyting o'rningiz</div>
            <div className="divider" />
            <div className="between"><span className="text-muted" style={{ fontSize: '.85rem' }}>Jami ball</span><b>{scores?.totalScore ?? 0}</b></div>
            <div className="between" style={{ marginTop: 8 }}><span className="text-muted" style={{ fontSize: '.85rem' }}>Test aniqligi</span><b>{scores?.testAccuracy ?? 0}%</b></div>
            <Link to="/leaderboard" className="btn btn-secondary btn-block" style={{ marginTop: 16 }}><Trophy /> Reytingni ko'rish</Link>
          </div>

          {/* Recent notifications */}
          <div className="card card-pad">
            <div className="between" style={{ marginBottom: 12 }}>
              <h3 style={{ fontSize: '1rem' }}>So'nggi xabarlar</h3>
              <Bell style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
            </div>
            {!notifications?.length ? (
              <p className="text-muted" style={{ fontSize: '.86rem' }}>Yangi bildirishnoma yo'q.</p>
            ) : (
              <div className="stack gap-3">
                {notifications.slice(0, 4).map((n) => (
                  <div key={n.id} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                    <span className="center" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: n.status === 'approved' ? 'var(--success-soft)' : n.status === 'rejected' ? 'var(--danger-soft)' : 'var(--info-soft)', color: n.status === 'approved' ? 'var(--success)' : n.status === 'rejected' ? 'var(--danger)' : 'var(--info)' }}>
                      {n.status === 'approved' ? <CheckCircle2 style={{ width: 15, height: 15 }} /> : <Clock style={{ width: 15, height: 15 }} />}
                    </span>
                    <div className="grow">
                      <div style={{ fontSize: '.85rem', fontWeight: 600 }}>{n.title}</div>
                      <div className="text-muted" style={{ fontSize: '.76rem' }}>{timeAgo(n.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- TEACHER ---------------- */
function QuickAction({ to, icon: Icon, title, desc, tone }) {
  return (
    <Link to={to} className="card card-pad card-hover row gap-3" style={{ textDecoration: 'none' }}>
      <span className="center" style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: tone, color: '#fff' }}><Icon /></span>
      <div className="grow">
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div className="text-muted" style={{ fontSize: '.82rem' }}>{desc}</div>
      </div>
      <ArrowRight style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
    </Link>
  )
}

function TeacherDashboard({ user }) {
  const { data: courses, isLoading } = useTeacherCourses()
  const { data: pending } = useTeacherSubmissions('pending')

  return (
    <div>
      <Welcome name={user.name} sub="Kurslaringizni boshqaring, vazifalarni baholang va o'quvchilaringizni ilhomlantiring." />

      {isLoading ? <StatsSkeleton count={3} /> : (
        <div className="grid-stats">
          <StatCard icon={FolderKanban} tone="brand" value={courses?.length ?? 0} label="Kurslarim" />
          <StatCard icon={FileCheck2} tone="sunset" value={pending?.length ?? 0} label="Tekshirishni kutmoqda" />
          <StatCard icon={Layers} tone="mint" value={courses?.filter((c) => c.isPublished).length ?? 0} label="Nashr qilingan" />
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 26 }}>
        <QuickAction to="/teach/courses" icon={Plus} title="Yangi kurs yaratish" desc="Kurs qo'shing va darslarni tashkil qiling" tone="var(--grad-brand)" />
        <QuickAction to="/teach/submissions" icon={FileCheck2} title="Topshiriqlarni baholash" desc={`${pending?.length ?? 0} ta vazifa kutmoqda`} tone="var(--grad-sunset)" />
        <QuickAction to="/teach/tests" icon={ClipboardList} title="Test yaratish" desc="O'quvchilar bilimini sinang" tone="linear-gradient(135deg,#3b82f6,#6366f1)" />
        <QuickAction to="/teach/courses" icon={FolderKanban} title="Kurslarni boshqarish" desc="Tahrirlash va darslar qo'shish" tone="var(--grad-mint)" />
      </div>

      <div style={{ marginTop: 26 }}>
        <div className="between" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem' }}>Kurslarim</h2>
          <Link to="/teach/courses" className="btn btn-ghost btn-sm">Boshqarish <ArrowRight /></Link>
        </div>
        {!courses?.length ? (
          <EmptyState icon={FolderKanban} title="Hali kurs yaratmagansiz"
            action={<Link to="/teach/courses" className="btn btn-primary"><Plus /> Kurs yaratish</Link>} />
        ) : (
          <div className="grid-cards">
            {courses.slice(0, 6).map((c) => (
              <CourseCard key={c._id} course={c} to={`/teach/courses/${c._id}/lessons`}
                footer={<Link to={`/teach/courses/${c._id}/lessons`} className="btn btn-secondary btn-block">Darslarni boshqarish</Link>} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- ADMIN ---------------- */
function AdminDashboard({ user }) {
  const { data: users, isLoading } = useAllUsers()
  const { data: courses } = useCourses()
  const students = users?.filter((u) => u.role === 'student').length ?? 0
  const teachers = users?.filter((u) => u.role === 'teacher').length ?? 0

  return (
    <div>
      <Welcome name={user.name} sub="Platforma holatini kuzating va foydalanuvchilarni boshqaring." />
      {isLoading ? <StatsSkeleton /> : (
        <div className="grid-stats">
          <StatCard icon={Users} tone="brand" value={users?.length ?? 0} label="Foydalanuvchilar" />
          <StatCard icon={GraduationCap} tone="info" value={students} label="O'quvchilar" />
          <StatCard icon={Award} tone="mint" value={teachers} label="O'qituvchilar" />
          <StatCard icon={Layers} tone="sunset" value={courses?.length ?? 0} label="Kurslar" />
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 26 }}>
        <QuickAction to="/admin/users" icon={Users} title="Foydalanuvchilar" desc="Ro'yxat, rollar va parollar" tone="var(--grad-brand)" />
        <QuickAction to="/admin/courses" icon={Layers} title="Barcha kurslar" desc="Kurslarni kuzatish va boshqarish" tone="var(--grad-mint)" />
        <QuickAction to="/admin/analytics" icon={TrendingUp} title="Analitika" desc="Statistika va grafiklar" tone="linear-gradient(135deg,#3b82f6,#6366f1)" />
        <QuickAction to="/teach/submissions" icon={FileCheck2} title="Topshiriqlar" desc="Barcha topshiriqlarni ko'rish" tone="var(--grad-sunset)" />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  if (!user) return null
  if (user.role === 'teacher') return <TeacherDashboard user={user} />
  if (user.role === 'admin') return <AdminDashboard user={user} />
  return <StudentDashboard user={user} />
}
