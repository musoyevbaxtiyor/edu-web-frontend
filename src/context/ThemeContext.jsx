import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const KEY = 'eduweb_theme'

function initialTheme() {
  const saved = localStorage.getItem(KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)

  useEffect(() => {
    const root = document.documentElement
    // Mavzu almashganda o'tishlarni vaqtincha o'chirish — var() ranglari "qotib" qolmasligi uchun.
    // MUHIM: klass qo'shilgach reflow majburlanadi, so'ngra atribut o'zgartiriladi —
    // aks holda brauzer ikkalasini birlashtirib, o'tishni baribir ishga tushiradi.
    root.classList.add('theme-switching')
    void root.offsetHeight // reflow: transition:none holatini "commit" qilish
    root.setAttribute('data-theme', theme)
    localStorage.setItem(KEY, theme)
    const raf = requestAnimationFrame(() => root.classList.remove('theme-switching'))
    return () => cancelAnimationFrame(raf)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, setTheme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme ThemeProvider ichida ishlatilishi kerak')
  return ctx
}
