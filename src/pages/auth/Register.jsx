import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Calendar, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import AuthAside from './AuthAside'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import './auth.css'

const EMPTY = { name: '', email: '', phone: '', age: '', password: '', confirm: '' }

export default function Register() {
  const { register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const err = {}
    if (form.name.trim().length < 2) err.name = 'Ism kamida 2 harf'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = "Email noto'g'ri"
    if (form.phone.replace(/\s+/g, '').length < 9) err.phone = "Telefon noto'g'ri"
    const age = parseInt(form.age)
    if (isNaN(age) || age < 14 || age > 120) err.age = '14–120 orasida'
    if (form.password.length < 6) err.password = 'Kamida 6 belgi'
    if (form.password !== form.confirm) err.confirm = 'Parollar mos emas'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        age: parseInt(form.age),
        password: form.password,
      })
      toast.success(`Xush kelibsiz, ${user?.name || ''}! Hisobingiz yaratildi.`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || "Ro'yxatdan o'tishda xatolik")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <AuthAside quote="Bugun boshlang. Kelajakdagi o'zingiz buning uchun minnatdor bo'ladi." />
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-head">
            <h1>Ro'yxatdan o'tish</h1>
            <p>Bepul hisob yarating va o'rganishni boshlang.</p>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="field">
              <label className="label">To'liq ism</label>
              <div className="input-group">
                <User />
                <input className={`input ${errors.name ? 'error' : ''}`} placeholder="Ism Familiya" value={form.name} onChange={set('name')} />
              </div>
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="field">
              <label className="label">Email</label>
              <div className="input-group">
                <Mail />
                <input className={`input ${errors.email ? 'error' : ''}`} type="email" placeholder="sizning@email.com" value={form.email} onChange={set('email')} />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="auth-row">
              <div className="field">
                <label className="label">Telefon</label>
                <div className="input-group">
                  <Phone />
                  <input className={`input ${errors.phone ? 'error' : ''}`} placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
              <div className="field">
                <label className="label">Yosh</label>
                <div className="input-group">
                  <Calendar />
                  <input className={`input ${errors.age ? 'error' : ''}`} type="number" min="14" placeholder="18" value={form.age} onChange={set('age')} />
                </div>
                {errors.age && <span className="field-error">{errors.age}</span>}
              </div>
            </div>

            <div className="field">
              <label className="label">Parol</label>
              <div className="input-group">
                <Lock />
                <input className={`input ${errors.password ? 'error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} style={{ paddingRight: 42 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label="Parol">
                  {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="field">
              <label className="label">Parolni tasdiqlang</label>
              <div className="input-group">
                <Lock />
                <input className={`input ${errors.confirm ? 'error' : ''}`} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.confirm} onChange={set('confirm')} />
              </div>
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>

            <Button type="submit" size="lg" block loading={loading}>
              Hisob yaratish <ArrowRight />
            </Button>
          </form>

          <p className="auth-foot">
            Hisobingiz bormi? <Link to="/login">Tizimga kiring</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
