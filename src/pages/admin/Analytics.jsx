import { useMemo } from 'react'
import { Users, GraduationCap, Layers, CheckCircle2, BarChart3 } from 'lucide-react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { StatsSkeleton } from '../../components/Skeletons'
import { EmptyState } from '../../components/ui'
import { useAllUsers, useCourses, useRatings } from '../../hooks/useApi'

const TICK = { fill: '#94a3b8', fontSize: 12 }
const TOOLTIP_STYLE = {
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 10,
  color: '#f1f5f9',
  fontSize: 13,
}

function shortName(name = '') {
  const clean = String(name).trim()
  if (!clean) return "Noma'lum"
  const first = clean.split(/\s+/)[0]
  return first.length > 12 ? first.slice(0, 12) + '…' : first
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="card card-pad">
      <div className="row gap-2" style={{ marginBottom: 16 }}>
        {Icon && <Icon style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />}
        <h3 style={{ fontSize: '1rem' }}>{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Legend({ items }) {
  return (
    <div className="row wrap gap-4" style={{ justifyContent: 'center', marginTop: 12 }}>
      {items.map((it) => (
        <div key={it.name} className="row gap-2" style={{ alignItems: 'center' }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: it.color, flexShrink: 0 }} />
          <span style={{ fontSize: '.82rem' }}>
            {it.name} <b>{it.value}</b>
          </span>
        </div>
      ))}
    </div>
  )
}

function ChartEmpty({ message }) {
  return (
    <div className="center text-muted" style={{ height: 300, fontSize: '.88rem' }}>
      {message}
    </div>
  )
}

export default function Analytics() {
  const { data: users, isLoading: loadingUsers } = useAllUsers()
  const { data: courses, isLoading: loadingCourses } = useCourses()
  const { data: ratings, isLoading: loadingRatings } = useRatings()

  const isLoading = loadingUsers || loadingCourses || loadingRatings

  const students = users?.filter((u) => u.role === 'student').length ?? 0
  const teachers = users?.filter((u) => u.role === 'teacher').length ?? 0
  const admins = users?.filter((u) => u.role === 'admin').length ?? 0
  const published = courses?.filter((c) => c.isPublished).length ?? 0
  const drafts = (courses?.length ?? 0) - published

  const roleData = useMemo(
    () => [
      { name: "O'quvchilar", value: students, color: '#6366f1' },
      { name: "O'qituvchilar", value: teachers, color: '#22d3ee' },
      { name: 'Adminlar', value: admins, color: '#f59e0b' },
    ].filter((d) => d.value > 0),
    [students, teachers, admins],
  )

  const courseData = useMemo(
    () => [
      { name: 'Nashr qilingan', value: published, color: '#22c55e' },
      { name: 'Qoralama', value: drafts, color: '#f59e0b' },
    ],
    [published, drafts],
  )

  const topStudents = useMemo(
    () =>
      (ratings || []).slice(0, 10).map((r) => ({
        name: shortName(r.student?.name),
        score: r.totalScore ?? 0,
      })),
    [ratings],
  )

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Analitika" subtitle="Platforma statistikasi va grafiklar." />
        <StatsSkeleton />
        <div className="grid-2" style={{ marginTop: 26 }}>
          <div className="skeleton" style={{ height: 360, borderRadius: 'var(--r-lg)' }} />
          <div className="skeleton" style={{ height: 360, borderRadius: 'var(--r-lg)' }} />
        </div>
        <div className="skeleton" style={{ height: 360, borderRadius: 'var(--r-lg)', marginTop: 26 }} />
      </div>
    )
  }

  const noData = !users?.length && !courses?.length

  return (
    <div>
      <PageHeader title="Analitika" subtitle="Platforma statistikasi va grafiklar." />

      {noData ? (
        <EmptyState
          icon={BarChart3}
          title="Ma'lumot yo'q"
          message="Analitika uchun hozircha yetarli ma'lumot mavjud emas."
        />
      ) : (
        <>
          <div className="grid-stats">
            <StatCard icon={Users} tone="brand" value={users?.length ?? 0} label="Jami foydalanuvchi" />
            <StatCard icon={Layers} tone="info" value={courses?.length ?? 0} label="Kurslar" />
            <StatCard icon={GraduationCap} tone="mint" value={students} label="O'quvchilar" />
            <StatCard icon={CheckCircle2} tone="sunset" value={published} label="Nashr qilingan kurslar" />
          </div>

          <div className="grid-2" style={{ marginTop: 26 }}>
            <ChartCard title="Foydalanuvchilar rollari" icon={Users}>
              {roleData.length === 0 ? (
                <ChartEmpty message="Foydalanuvchilar mavjud emas." />
              ) : (
                <>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={roleData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {roleData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <Legend items={roleData} />
                </>
              )}
            </ChartCard>

            <ChartCard title="Kurslar holati" icon={Layers}>
              {(courses?.length ?? 0) === 0 ? (
                <ChartEmpty message="Kurslar mavjud emas." />
              ) : (
                <>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={courseData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />
                        <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill: '#94a3b8', fillOpacity: 0.08 }} contentStyle={TOOLTIP_STYLE} />
                        <Bar dataKey="value" name="Kurslar" radius={[8, 8, 0, 0]} maxBarSize={90}>
                          {courseData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Legend items={courseData} />
                </>
              )}
            </ChartCard>
          </div>

          <div style={{ marginTop: 26 }}>
            <ChartCard title="Eng faol o'quvchilar (TOP 10)" icon={BarChart3}>
              {topStudents.length === 0 ? (
                <ChartEmpty message="Hozircha reyting bo'sh." />
              ) : (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={topStudents} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />
                      <XAxis dataKey="name" tick={TICK} axisLine={false} tickLine={false} interval={0} />
                      <YAxis allowDecimals={false} tick={TICK} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#94a3b8', fillOpacity: 0.08 }} contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="score" name="Jami ball" fill="#6366f1" radius={[8, 8, 0, 0]} maxBarSize={56} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
