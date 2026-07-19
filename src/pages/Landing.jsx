import { Link } from 'react-router-dom'
import {
  GraduationCap, ArrowRight, Sun, Moon, BookOpen, Trophy, ClipboardCheck,
  Users, Coins, ShieldCheck, PlayCircle, Award, MessageSquare, Sparkles, Send,
} from 'lucide-react'
import Logo from '../components/layout/Logo'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './landing.css'

const FEATURES = [
  { icon: BookOpen, bg: 'var(--grad-brand)', title: 'Tizimli kurslar', text: "Video darslar, dokumentatsiya va amaliy vazifalar bilan bosqichma-bosqich o'rganing." },
  { icon: ClipboardCheck, bg: 'var(--grad-mint)', title: 'Amaliy vazifalar', text: "Har darsdan so'ng vazifa topshiring — o'qituvchi tekshiradi va ball beradi." },
  { icon: Trophy, bg: 'var(--grad-sunset)', title: 'Reyting va coinlar', text: "Ballaringizni to'plang, reytingda ko'tariling va coin mukofotlarini yuting." },
  { icon: ClipboardCheck, bg: 'linear-gradient(135deg,#3b82f6,#6366f1)', title: 'Interaktiv testlar', text: "Bilimingizni testlar orqali sinang va darhol natijani ko'ring." },
  { icon: ShieldCheck, bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)', title: 'Bosqichli ochilish', text: "Keyingi dars faqat oldingisini muvaffaqiyatli tugatgandan so'ng ochiladi." },
  { icon: Send, bg: 'linear-gradient(135deg,#0ea5e9,#22d3ee)', title: 'Telegram bot', text: "Natijalar va bildirishnomalarni to'g'ridan-to'g'ri Telegram orqali oling." },
]

const STEPS = [
  { title: "Ro'yxatdan o'ting", text: "Bir daqiqada bepul hisob yarating va platformaga kiring." },
  { title: 'Kursni tanlang', text: "Katalogdan o'zingizga mos kursni tanlab, unga yoziling." },
  { title: "O'rganing va topshiring", text: 'Video darslarni ko\'ring, vazifalarni bajaring va testlar yeching.' },
  { title: 'Natijaga erishing', text: "Ballar to'plang, sertifikat oling va reytingda yuqoriga chiqing." },
]

export default function Landing() {
  const { theme, toggle } = useTheme()
  const { isAuthenticated } = useAuth()

  return (
    <div className="lp">
      {/* NAV */}
      <header className="lp-nav">
        <div className="container lp-nav-inner">
          <Logo />
          <nav className="lp-nav-links">
            <a href="#features">Imkoniyatlar</a>
            <a href="#how">Qanday ishlaydi</a>
            <a href="#cta">Boshlash</a>
          </nav>
          <div className="row gap-2">
            <button className="icon-btn" onClick={toggle} aria-label="Mavzu">
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Panelga o'tish <ArrowRight /></Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Kirish</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Boshlash</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="container lp-hero-grid">
          <div className="animate-in">
            <span className="eyebrow"><Sparkles style={{ width: 14, height: 14 }} /> Zamonaviy onlayn ta'lim</span>
            <h1 className="lp-title" style={{ marginTop: 20 }}>
              Bilimga eng qisqa <br /> yo'l — <span className="text-gradient">EduWeb</span> bilan
            </h1>
            <p className="lp-lead">
              Video darslar, amaliy vazifalar, testlar va real vaqtli baholash — barchasi bitta zamonaviy platformada.
              O'z sur'atingizda o'rganing, ball to'plang va maqsadingizga yeting.
            </p>
            <div className="lp-cta">
              <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-primary btn-lg">
                <GraduationCap /> Bepul boshlash
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg"><PlayCircle /> Tizimga kirish</Link>
            </div>
            <div className="lp-hero-stats">
              <div className="lp-hero-stat"><b className="text-gradient">100+</b><span>Video dars</span></div>
              <div className="lp-hero-stat"><b className="text-gradient">24/7</b><span>Qulay vaqt</span></div>
              <div className="lp-hero-stat"><b className="text-gradient">A+</b><span>Baholash tizimi</span></div>
            </div>
          </div>

          <div className="lp-visual animate-in delay-2">
            <div className="lp-orb" />
            <div className="lp-float-card lp-float-1">
              <span className="lp-fc-icon" style={{ background: 'var(--grad-mint)' }}><Award /></span>
              <div><div style={{ fontWeight: 700 }}>Vazifa tasdiqlandi</div><div className="text-muted" style={{ fontSize: '.78rem' }}>+15 coin</div></div>
            </div>
            <div className="lp-float-card lp-float-2">
              <span className="lp-fc-icon" style={{ background: 'var(--grad-sunset)' }}><Trophy /></span>
              <div><div style={{ fontWeight: 700 }}>Reyting: #3</div><div className="text-muted" style={{ fontSize: '.78rem' }}>Bu hafta</div></div>
            </div>
            <div className="lp-float-card lp-float-3">
              <span className="lp-fc-icon" style={{ background: 'var(--grad-brand)' }}><Coins /></span>
              <div><div style={{ fontWeight: 700 }}>340 ball</div><div className="text-muted" style={{ fontSize: '.78rem' }}>Jami</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="section container">
        <div className="lp-section-head">
          <span className="eyebrow">Imkoniyatlar</span>
          <h2>O'rganish uchun kerak bo'lgan hamma narsa</h2>
          <p>EduWeb — bu shunchaki video darslar emas, balki to'liq o'quv ekotizimi.</p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f, i) => (
            <div key={f.title} className={`lp-feature card card-hover animate-in delay-${(i % 4) + 1}`}>
              <div className="lp-feature-icon" style={{ background: f.bg }}><f.icon /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="section container">
        <div className="lp-section-head">
          <span className="eyebrow">4 ta oddiy qadam</span>
          <h2>Qanday ishlaydi?</h2>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div key={s.title} className="lp-step card">
              <div className="lp-step-num">{String(i + 1).padStart(2, '0')}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="section container">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {[
            { icon: GraduationCap, bg: 'var(--grad-brand)', role: "O'quvchilar uchun", text: "Kurslarga yoziling, darslarni ko'ring, vazifa topshiring va ball to'plang." },
            { icon: Users, bg: 'var(--grad-mint)', role: "O'qituvchilar uchun", text: 'Kurs va darslar yarating, vazifalarni baholang, testlar tuzing.' },
            { icon: MessageSquare, bg: 'var(--grad-sunset)', role: 'Adminlar uchun', text: "Foydalanuvchilar, kurslar va butun platformani boshqaring." },
          ].map((r) => (
            <div key={r.role} className="card card-pad card-hover">
              <div className="lp-feature-icon" style={{ background: r.bg }}><r.icon /></div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{r.role}</h3>
              <p className="text-secondary">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="section container">
        <div className="lp-cta-band">
          <h2>Bugun o'rganishni boshlang</h2>
          <p>Ro'yxatdan o'tish bepul. Bir necha daqiqada birinchi darsingizni boshlang.</p>
          <Link to={isAuthenticated ? '/dashboard' : '/register'} className="btn btn-lg" style={{ background: '#fff', color: 'var(--brand-700)' }}>
            <GraduationCap /> Hisob yaratish <ArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="container lp-footer-grid">
          <div className="stack gap-2">
            <Logo />
            <p className="text-muted" style={{ fontSize: '.86rem', maxWidth: 320 }}>
              Zamonaviy onlayn ta'lim platformasi. Bilim — kelajakka investitsiya.
            </p>
          </div>
          <div className="text-muted" style={{ fontSize: '.85rem' }}>
            © {new Date().getFullYear()} EduWeb. Barcha huquqlar himoyalangan.
          </div>
        </div>
      </footer>
    </div>
  )
}
