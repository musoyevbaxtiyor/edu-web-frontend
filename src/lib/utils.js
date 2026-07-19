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

// YouTube/Vimeo/oddiy video URL -> embed manzili
export function toEmbedUrl(url = '') {
  if (!url) return ''
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}
