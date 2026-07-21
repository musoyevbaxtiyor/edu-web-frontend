export const cx = (...args) => args.filter(Boolean).join(' ')

export function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatPrice(price) {
  const n = Number(price) || 0
  if (n === 0) return 'Bepul'
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

export function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return ''
  return new Intl.DateTimeFormat('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

export function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (isNaN(d)) return ''
  return new Intl.DateTimeFormat('uz-UZ', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function timeAgo(value) {
  if (!value) return ''
  const d = new Date(value)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'hozirgina'
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`
  if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`
  return formatDate(value)
}

export const ROLE_LABELS = {
  student: "O'quvchi",
  teacher: "O'qituvchi",
  admin: 'Administrator',
}

export const DIFFICULTY = {
  easy: { label: 'Oson', badge: 'badge-success', score: 1 },
  medium: { label: "O'rta", badge: 'badge-warning', score: 2 },
  hard: { label: 'Qiyin', badge: 'badge-danger', score: 3 },
}

// Imtihon darajalari
export const EXAM_LEVELS = {
  easy: { label: 'Oson', short: 'Easy', badge: 'badge-success', tone: 'mint', order: 1 },
  middle: { label: "O'rta", short: 'Middle', badge: 'badge-warning', tone: 'gold', order: 2 },
  pro: { label: 'Pro', short: 'Pro', badge: 'badge-danger', tone: 'sunset', order: 3 },
}

// Amaliy tasklar (TaskFlow) — kategoriyalar
export const PRACTICE_CATEGORIES = {
  html: { label: 'HTML Tasklar', short: 'H', desc: "Semantik HTML va tuzilma bo'yicha vazifalar", color: '#e34f26', soft: 'rgba(227,79,38,0.16)' },
  css: { label: 'CSS Tasklar', short: 'C', desc: 'Uslublash, layout va animatsiya vazifalari', color: '#2563eb', soft: 'rgba(37,99,235,0.16)' },
  figma: { label: 'Figma Loyihalar', short: 'F', desc: 'UI/UX dizayn va prototiplash vazifalari', color: '#a855f7', soft: 'rgba(168,85,247,0.16)' },
  js: { label: 'JS Tasklar', short: 'JS', desc: 'JavaScript mantiq va dinamik dasturlash vazifalari', color: '#eab308', soft: 'rgba(234,179,8,0.16)' },
}
export const PRACTICE_CATEGORY_KEYS = ['html', 'css', 'figma', 'js']

// Amaliy tasklar — darajalar
export const PRACTICE_LEVELS = {
  easy: { label: 'Easy', short: 'E', badge: 'badge-success', color: '#10b981', order: 1 },
  middle: { label: 'Middle', short: 'M', badge: 'badge-warning', color: '#f59e0b', order: 2 },
  pro: { label: 'Pro', short: 'P', badge: 'badge-danger', color: '#ef4444', order: 3 },
}
export const PRACTICE_LEVEL_KEYS = ['easy', 'middle', 'pro']

// Topshiriq holati -> ko'rinish
export const PRACTICE_STATUS = {
  approved: { label: 'Tugatildi', badge: 'badge-success' },
  submitted: { label: 'Tekshirilmoqda', badge: 'badge-info' },
  in_review: { label: 'Tekshirilmoqda', badge: 'badge-info' },
  rejected: { label: 'Rad etildi', badge: 'badge-danger' },
}

// pct helper
export const pct = (done, total) => (total > 0 ? Math.round((done / total) * 100) : 0)

// YouTube/Vimeo/oddiy video URL -> embed manzili
export function toEmbedUrl(url = '') {
  if (!url) return ''
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}
