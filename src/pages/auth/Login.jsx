import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Button from '../../components/ui/Button'
import AuthAside from './AuthAside'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import './auth.css'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email.trim(), form.password)
      toast.success(`Xush kelibsiz, ${user?.name || ''}!`)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || "Email yoki parol noto'g'ri")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <AuthAside quote="Xush kelibsiz! Bilim sari safaringizni davom ettiring." />
      <div className="auth-main">
        <div className="auth-card">
          <div className="auth-head">
            <h1>Tizimga kirish</h1>
            <p>Hisobingizga kirib, o'qishni davom ettiring.</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <div className="input-group">
                <Mail />
                <input id="email" className="input" type="email" required autoComplete="email"
                  placeholder="sizning@email.com" value={form.email} onChange={set('email')} />
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="password">Parol</label>
              <div className="input-group">
                <Lock />
                <input id="password" className="input" type={showPw ? 'text' : 'password'} required
                  autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={set('password')}
                  style={{ paddingRight: 42 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} aria-label="Parolni ko'rsatish">
                  {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" block loading={loading}>
              Kirish <ArrowRight />
            </Button>
          </form>

          <p className="auth-foot">
            Hisobingiz yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
