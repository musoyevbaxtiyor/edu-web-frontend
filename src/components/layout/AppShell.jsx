import { useState, useEffect, useRef } from 'react'
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import { Menu, Sun, Moon, Bell, LogOut, User, ChevronDown, Coins } from 'lucide-react'
import Logo from './Logo'
import Avatar from '../ui/Avatar'
import { navForRole } from './navConfig'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNotifications, useStatistics } from '../../hooks/useApi'
import { ROLE_LABELS } from '../../lib/utils'
import './shell.css'

function SidebarNav({ nav, onNavigate, unread }) {
  return (
    <nav className="sidebar-scroll">
      {nav.main.map((item) => (
        <NavLink key={item.to} to={item.to} className="nav-link" onClick={onNavigate} end={item.to === '/dashboard'}>
          <item.icon />
          <span>{item.label}</span>
        </NavLink>
      ))}
      <div className="nav-group-label">Boshqa</div>
      {nav.secondary.map((item) => (
        <NavLink key={item.to} to={item.to} className="nav-link" onClick={onNavigate}>
          <item.icon />
          <span>{item.label}</span>
          {item.to === '/notifications' && unread > 0 && <span className="nav-badge">{unread}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button className="user-chip" onClick={() => setOpen((o) => !o)}>
        <Avatar name={user?.name} size="sm" />
        <span className="user-chip-meta">
          <span className="user-chip-name">{user?.name}</span>
          <span className="user-chip-role">{ROLE_LABELS[user?.role] || user?.role}</span>
        </span>
        <ChevronDown style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
      </button>
      {open && (
        <div className="menu" style={{ right: 0, top: 'calc(100% + 8px)' }}>
          <div style={{ padding: '8px 12px 10px' }}>
            <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{user?.name}</div>
            <div className="text-muted" style={{ fontSize: '.8rem' }}>{user?.email}</div>
          </div>
          <div className="menu-sep" />
          <button className="menu-item" onClick={() => { setOpen(false); navigate('/profile') }}>
            <User /> Profil
          </button>
          <button className="menu-item danger" onClick={() => { logout(); navigate('/login') }}>
            <LogOut /> Chiqish
          </button>
        </div>
      )}
    </div>
  )
}

const TITLES = {
  '/dashboard': 'Boshqaruv paneli',
  '/courses': 'Kurslar katalogi',
  '/my-courses': 'Mening kurslarim',
  '/tests': 'Testlar',
  '/leaderboard': 'Reyting',
  '/notifications': 'Bildirishnomalar',
  '/profile': 'Profil',
  '/teach/courses': 'Kurslarim',
  '/teach/submissions': 'Topshiriqlar',
  '/teach/tests': 'Testlar boshqaruvi',
  '/admin/users': 'Foydalanuvchilar',
  '/admin/courses': 'Barcha kurslar',
  '/admin/analytics': 'Analitika',
}

export default function AppShell() {
  const { user, role } = useAuth()
  const { theme, toggle } = useTheme()
  const [drawer, setDrawer] = useState(false)
  const location = useLocation()
  const nav = navForRole(role)
  const { data: notifications } = useNotifications()
  const { data: stats } = useStatistics(role === 'student')
  const unread = notifications?.length || 0

  useEffect(() => { setDrawer(false) }, [location.pathname])

  const title = TITLES[location.pathname] || (location.pathname.startsWith('/courses/') ? 'Kurs' : 'Edu Web')

  return (
    <div className="app-shell">
      <aside className={`sidebar ${drawer ? 'open' : ''}`}>
        <div className="sidebar-brand"><Logo to="/dashboard" /></div>
        <SidebarNav nav={nav} onNavigate={() => setDrawer(false)} unread={unread} />
        <div className="sidebar-foot">
          {role === 'student' && (
            <div className="row gap-2" style={{ padding: '10px 12px', borderRadius: 'var(--r-sm)', background: 'var(--grad-brand-soft)' }}>
              <Coins style={{ width: 20, height: 20, color: 'var(--warning)' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{stats?.coins ?? 0} coin</div>
                <div className="text-muted" style={{ fontSize: '.72rem' }}>To'plangan ballaringiz</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className={`sidebar-overlay ${drawer ? 'show' : ''}`} onClick={() => setDrawer(false)} />

      <div className="app-main">
        <header className="topbar">
          <button className="icon-btn hamburger" onClick={() => setDrawer(true)} aria-label="Menyu">
            <Menu />
          </button>
          <h1 className="topbar-title grow truncate">{title}</h1>

          <button className="icon-btn" onClick={toggle} aria-label="Mavzu almashtirish" title={theme === 'dark' ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}>
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
          <Link to="/notifications" className="icon-btn" aria-label="Bildirishnomalar">
            <Bell />
            {unread > 0 && <span className="dot" />}
          </Link>
          <UserMenu />
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
