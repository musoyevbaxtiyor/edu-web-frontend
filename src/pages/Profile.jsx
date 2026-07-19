import { useEffect, useMemo, useState } from 'react'
import {
  User, Mail, Phone, Hash, Save, Send, Coins, ShieldCheck,
  Calendar, ExternalLink, Info, CheckCircle2, Copy,
} from 'lucide-react'
import PageHeader from '../components/PageHeader'
import { Button, Avatar } from '../components/ui'
import { useUpdateProfile, useTelegramToken, useStatistics } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate, ROLE_LABELS } from '../lib/utils'

const ROLE_BADGE = {
  student: 'badge-info',
  teacher: 'badge-brand',
  admin: 'badge-warning',
}

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()
  const updateProfile = useUpdateProfile()

  const isStudent = user?.role === 'student'
  const { data: stats } = useStatistics(isStudent)
  const coins = stats?.coins ?? user?.coins ?? 0

  const [form, setForm] = useState({ name: '', email: '', phone: '', age: '' })

  useEffect(() => {
    if (!user) return
    setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      age: user.age ?? '',
    })
  }, [user])

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const onSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.error('Ismni kiriting.')
    if (!form.email.trim()) return toast.error('Email manzilini kiriting.')
    try {
      await updateProfile.mutateAsync({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        age: form.age === '' ? undefined : Number(form.age),
      })
      await refreshUser()
      toast.success('Profil muvaffaqiyatli yangilandi.')
    } catch (err) {
      toast.error(err.message)
    }
  }

  /* ---------- Telegram ulash ---------- */
  const [tgEnabled, setTgEnabled] = useState(false)
  const { data: tg, isFetching: tgLoading, refetch: refetchTg } = useTelegramToken(tgEnabled)

  const connectTelegram = async () => {
    setTgEnabled(true)
    try {
      const res = await refetchTg()
      if (res.error) throw res.error
    } catch (err) {
      toast.error(err.message)
    }
  }

  const tgToken = tg?.token
  const tgLink = tg?.botLink
  const tgMessage = tg?.message
  const tgConnected = tg?.isConnected

  const copyToken = async () => {
    if (!tgToken) return
    try {
      await navigator.clipboard.writeText(tgToken)
      toast.success('Token nusxalandi.')
    } catch {
      toast.error('Nusxalab bo\'lmadi.')
    }
  }

  const memberSince = useMemo(() => formatDate(user?.createdAt), [user])

  if (!user) return null

  return (
    <div>
      <PageHeader title="Profil" subtitle="Shaxsiy ma'lumotlaringizni boshqaring va hisobingizni sozlang." />

      <div className="grid-sidebar">
        {/* ------- CHAP: tahrirlanadigan forma ------- */}
        <div className="card card-pad">
          <h2 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Shaxsiy ma'lumotlar</h2>
          <p className="text-muted" style={{ fontSize: '.86rem', marginBottom: 20 }}>
            Ma'lumotlaringizni yangilab, "Saqlash" tugmasini bosing.
          </p>

          <form onSubmit={onSave} className="stack gap-4">
            <div className="field">
              <label className="label" htmlFor="name">To'liq ism</label>
              <div className="input-group">
                <User />
                <input id="name" className="input" placeholder="Ism familiya"
                  value={form.name} onChange={setField('name')} />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <div className="input-group">
                <Mail />
                <input id="email" type="email" className="input" placeholder="email@example.com"
                  value={form.email} onChange={setField('email')} />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="phone">Telefon</label>
                <div className="input-group">
                  <Phone />
                  <input id="phone" className="input" placeholder="+998 90 123 45 67"
                    value={form.phone} onChange={setField('phone')} />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="age">Yosh</label>
                <div className="input-group">
                  <Hash />
                  <input id="age" type="number" min="1" max="120" className="input" placeholder="Masalan, 20"
                    value={form.age} onChange={setField('age')} />
                </div>
              </div>
            </div>

            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
              <Button type="submit" loading={updateProfile.isPending}>
                <Save /> Saqlash
              </Button>
            </div>
          </form>
        </div>

        {/* ------- O'NG: profil kartasi + Telegram ------- */}
        <div className="stack gap-4">
          {/* Profil kartasi */}
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <Avatar size="xl" name={user.name} style={{ margin: '0 auto 14px' }} />
            <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{user.name}</div>
            <div className="text-muted" style={{ fontSize: '.86rem', marginTop: 2 }}>{user.email}</div>

            <div className="row" style={{ justifyContent: 'center', marginTop: 12 }}>
              <span className={`badge ${ROLE_BADGE[user.role] || 'badge-brand'}`}>
                <ShieldCheck /> {ROLE_LABELS[user.role] || user.role}
              </span>
            </div>

            <div className="divider" />

            <div className="between" style={{ fontSize: '.86rem' }}>
              <span className="text-muted row gap-2"><Calendar style={{ width: 15, height: 15 }} /> A'zo bo'lgan sana</span>
              <b>{memberSince || '—'}</b>
            </div>

            {isStudent && (
              <div className="between" style={{ fontSize: '.86rem', marginTop: 12 }}>
                <span className="text-muted row gap-2"><Coins style={{ width: 15, height: 15 }} /> Coinlar</span>
                <b style={{ color: 'var(--warning)' }}>{coins}</b>
              </div>
            )}
          </div>

          {/* Telegram ulash */}
          <div className="card card-pad">
            <div className="row gap-3" style={{ marginBottom: 12 }}>
              <span className="stat-icon" style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#38bdf8,#0ea5e9)' }}>
                <Send />
              </span>
              <div className="grow">
                <div style={{ fontWeight: 700 }}>Telegram ulash</div>
                <div className="text-muted" style={{ fontSize: '.8rem' }}>
                  Bildirishnomalarni Telegram orqali oling.
                </div>
              </div>
            </div>

            {tgConnected && (
              <div className="alert alert-success" style={{ marginBottom: 12 }}>
                <CheckCircle2 />
                <div>Telegram hisobingiz ulangan.</div>
              </div>
            )}

            {tgMessage && !tgToken && (
              <div className="alert alert-info" style={{ marginBottom: 12 }}>
                <Info />
                <div>{tgMessage}</div>
              </div>
            )}

            {tgToken ? (
              <div className="stack gap-3">
                <div className="alert alert-info">
                  <Info />
                  <div>
                    Telegram botini oching va unga <b>/start</b> buyrug'ini quyidagi token bilan yuboring.
                  </div>
                </div>

                <div className="field">
                  <label className="label">Sizning tokeningiz</label>
                  <div className="input-group">
                    <input className="input" readOnly value={tgToken}
                      style={{ paddingLeft: 14, paddingRight: 44, fontFamily: 'var(--font-mono, monospace)', fontSize: '.82rem' }}
                      onFocus={(e) => e.target.select()} />
                    <button type="button" className="btn btn-ghost btn-icon btn-sm input-affix"
                      onClick={copyToken} aria-label="Nusxalash" title="Nusxalash">
                      <Copy />
                    </button>
                  </div>
                </div>

                {tgLink && (
                  <Button as="a" href={tgLink} target="_blank" rel="noopener noreferrer" variant="secondary" block>
                    <ExternalLink /> Telegram botini ochish
                  </Button>
                )}
              </div>
            ) : (
              <Button block loading={tgLoading} onClick={connectTelegram}>
                <Send /> Telegram ulash
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
