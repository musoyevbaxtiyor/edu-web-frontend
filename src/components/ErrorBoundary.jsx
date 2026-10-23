import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button, EmptyState } from './ui'
import { PageLoader } from './ui/Spinner'

/* ============================================================
   Xatolik chegarasi (lazy sahifalar uchun)
   - yangi deploydan keyin eski chunk topilmasa — sahifa bir marta qayta yuklanadi
   - boshqa xatolarda — oq ekran o'rniga xabar va "Qayta yuklash" tugmasi
   ============================================================ */

const RELOAD_KEY = 'eduweb_chunk_reload'
const CHUNK_ERROR =
  /Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed|Unable to preload CSS|ChunkLoadError/i

export const isChunkError = (error) =>
  error?.name === 'ChunkLoadError' || CHUNK_ERROR.test(String(error?.message || error || ''))

// Qayta yuklash boshlangan bo'lsa — keyingi xatolarda xabar emas, yuklanish ko'rsatiladi
let reloadStarted = false

// Qayta yuklash sikliga tushmaslik uchun: oxirgi 15 soniyada yuklangan bo'lsa — qaytarmaymiz
export function reloadOnce() {
  if (reloadStarted) return true
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0)
    if (Date.now() - last < 15000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    return false
  }
  reloadStarted = true
  window.location.reload()
  return true
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, reloading: false }
  }

  static getDerivedStateFromError(error) {
    return { error, reloading: reloadStarted || isChunkError(error) }
  }

  componentDidCatch(error, info) {
    console.error('Sahifada xatolik:', error, info?.componentStack)
    if (isChunkError(error) && !reloadOnce()) this.setState({ reloading: false })
  }

  componentDidUpdate(prevProps) {
    // Boshqa sahifaga o'tilganda xatolik holatini tozalaymiz
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null, reloading: false })
    }
  }

  render() {
    const { error, reloading } = this.state
    if (!error) return this.props.children
    if (reloading) return <PageLoader label="Yangilanmoqda..." />

    const chunk = isChunkError(error)
    return (
      <div className="center" style={{ minHeight: '60vh', padding: 16 }}>
        <EmptyState
          icon={AlertTriangle}
          title={chunk ? 'Ilovaning yangi versiyasi chiqdi' : 'Sahifani ko\'rsatishda xatolik yuz berdi'}
          message={
            chunk
              ? 'Davom etish uchun sahifani qayta yuklang.'
              : 'Sahifani qayta yuklab ko\'ring. Muammo takrorlansa, birozdan so\'ng urinib ko\'ring.'
          }
          action={
            <Button onClick={() => window.location.reload()}>
              <RotateCcw /> Qayta yuklash
            </Button>
          }
        />
      </div>
    )
  }
}
