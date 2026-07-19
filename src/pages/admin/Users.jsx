import { useMemo, useState } from 'react'
import { Search, Users, GraduationCap, Award, ShieldCheck, KeyRound, Coins } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { RowsSkeleton } from '../../components/Skeletons'
import { Button, Modal, EmptyState, Avatar } from '../../components/ui'
import { useAllUsers, useAdminSetPassword } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate, ROLE_LABELS } from '../../lib/utils'

const ROLE_TABS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'student', label: "O'quvchi" },
  { key: 'teacher', label: "O'qituvchi" },
  { key: 'admin', label: 'Admin' },
]

const ROLE_BADGE = {
  student: 'badge-brand',
  teacher: 'badge-info',
  admin: 'badge-warning',
}

export default function AdminUsers() {
  const toast = useToast()
  const { data: users, isLoading } = useAllUsers()
  const setPassword = useAdminSetPassword()

  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')
  const [target, setTarget] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [err, setErr] = useState('')

  const stats = useMemo(() => {
    const list = users || []
    return {
      total: list.length,
      students: list.filter((u) => u.role === 'student').length,
      teachers: list.filter((u) => u.role === 'teacher').length,
      admins: list.filter((u) => u.role === 'admin').length,
    }
  }, [users])

  const list = useMemo(() => {
    let out = users || []
    if (role !== 'all') out = out.filter((u) => u.role === role)
    if (q.trim()) {
      const s = q.toLowerCase()
      out = out.filter(
        (u) => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s),
      )
    }
    return out
  }, [users, role, q])

  const openModal = (user) => {
    setTarget(user)
    setNewPassword('')
    setErr('')
  }

  const closeModal = () => {
    if (setPassword.isPending) return
    setTarget(null)
    setNewPassword('')
    setErr('')
  }

  const onSave = async () => {
    if (newPassword.trim().length < 6) {
      setErr("Parol kamida 6 ta belgidan iborat bo'lishi kerak.")
      return
    }
    try {
      await setPassword.mutateAsync({ userId: target._id, newPassword: newPassword.trim() })
      toast.success(`${target.name} uchun parol yangilandi.`)
      setTarget(null)
      setNewPassword('')
      setErr('')
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div>
      <PageHeader
        title="Foydalanuvchilar"
        subtitle="Platforma foydalanuvchilarini kuzating va parollarini boshqaring."
      />

      {isLoading ? (
        <RowsSkeleton rows={2} />
      ) : (
        <div className="grid-stats">
          <StatCard icon={Users} tone="brand" value={stats.total} label="Jami foydalanuvchi" />
          <StatCard icon={GraduationCap} tone="info" value={stats.students} label="O'quvchilar" />
          <StatCard icon={Award} tone="mint" value={stats.teachers} label="O'qituvchilar" />
          <StatCard icon={ShieldCheck} tone="sunset" value={stats.admins} label="Adminlar" />
        </div>
      )}

      <div className="between wrap gap-3" style={{ margin: '26px 0 18px' }}>
        <div className="input-group" style={{ maxWidth: 360, flex: 1 }}>
          <Search />
          <input
            className="input"
            placeholder="Ism yoki email bo'yicha qidirish..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="tabs">
          {ROLE_TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${role === t.key ? 'active' : ''}`}
              onClick={() => setRole(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={6} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Foydalanuvchi topilmadi"
          message={
            q || role !== 'all'
              ? "Filtr bo'yicha hech qanday foydalanuvchi topilmadi."
              : "Hozircha ro'yxatdan o'tgan foydalanuvchilar yo'q."
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Foydalanuvchi</th>
                <th>Email</th>
                <th>Telefon</th>
                <th>Yosh</th>
                <th>Rol</th>
                <th>Coin</th>
                <th>Ro'yxatdan o'tgan</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div className="row gap-2" style={{ alignItems: 'center' }}>
                      <Avatar name={u.name} size="sm" />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="text-secondary">{u.email}</td>
                  <td className="text-secondary">{u.phone || '—'}</td>
                  <td className="text-secondary">{u.age || '—'}</td>
                  <td>
                    <span className={`badge ${ROLE_BADGE[u.role] || ''}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <span className="row gap-1" style={{ alignItems: 'center', fontWeight: 600 }}>
                      <Coins style={{ width: 15, height: 15, color: 'var(--warning)' }} />
                      {u.coins ?? 0}
                    </span>
                  </td>
                  <td className="text-secondary" style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button variant="secondary" size="sm" onClick={() => openModal(u)}>
                      <KeyRound /> Parol o'zgartirish
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!target}
        onClose={closeModal}
        title="Parolni o'zgartirish"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={setPassword.isPending}>
              Bekor qilish
            </Button>
            <Button onClick={onSave} loading={setPassword.isPending}>
              Saqlash
            </Button>
          </>
        }
      >
        {target && (
          <div className="stack gap-4">
            <div className="row gap-3" style={{ alignItems: 'center' }}>
              <Avatar name={target.name} />
              <div>
                <div style={{ fontWeight: 700 }}>{target.name}</div>
                <div className="text-muted" style={{ fontSize: '.85rem' }}>{target.email}</div>
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="new-password">Yangi parol</label>
              <input
                id="new-password"
                type="password"
                className={`input ${err ? 'error' : ''}`}
                placeholder="Kamida 6 ta belgi"
                value={newPassword}
                autoFocus
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (err) setErr('')
                }}
                onKeyDown={(e) => e.key === 'Enter' && onSave()}
              />
              {err && <span className="field-error">{err}</span>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
