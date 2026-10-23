import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://edu-web-backend.onrender.com/api'

// Fayl (uploads) manzillari uchun server ildizi (/api siz)
export const SERVER_URL = BASE_URL.replace(/\/api\/?$/, '')

const TOKEN_KEY = 'eduweb_token'

// Sessiya tugaganda (401) AuthContext'ga yuboriladigan hodisa
export const UNAUTHORIZED_EVENT = 'eduweb:unauthorized'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

// Har bir so'rovga tokenni qo'shish
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Javob xatolarini bir xil formatga keltirish + 401 da chiqarib yuborish
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error.response?.status
    let data = error.response?.data
    // responseType: 'blob' so'rovlarida xato javobi ham Blob bo'lib keladi — JSON'ni o'qiymiz
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      try {
        data = JSON.parse(await data.text())
      } catch {
        data = null
      }
    }
    const serverMsg = data?.message
    let message = serverMsg

    if (!error.response) {
      message =
        error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
          ? "So'rov juda uzoq davom etdi. Internet aloqasini tekshirib, qayta urinib ko'ring."
          : "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring."
    } else if (status === 401) {
      // Token yaroqsiz — sessiyani tozalaymiz va AuthContext'ga xabar beramiz.
      // Oldingi sessiya (boshqa token yoki tokensiz) bilan ketgan kechikkan so'rov yangi sessiyani buzmasin.
      const sent = String(error.config?.headers?.Authorization || '').replace(/^Bearer /, '')
      const current = getToken()
      const stale = !!current && sent !== current
      if (!error.config?.url?.includes('/auth/login') && !stale) {
        setToken(null)
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      }
      message = message || 'Sessiya tugadi. Iltimos, qaytadan kiring.'
    } else if (status === 403) {
      message = message || "Bu amalni bajarishga ruxsatingiz yo'q."
    } else if (status >= 500) {
      message = message || 'Serverda xatolik yuz berdi. Birozdan so\'ng urinib ko\'ring.'
    }

    const err = new Error(message || 'Kutilmagan xatolik yuz berdi.')
    err.status = status // 401 / 403 / 5xx ni ajratish uchun (javobsiz xatoda undefined)
    return Promise.reject(err)
  },
)

// Qulaylik uchun qisqa yordamchilar
export const get = (url, config) => api.get(url, config).then((r) => r.data)
export const post = (url, body, config) => api.post(url, body, config).then((r) => r.data)
export const put = (url, body, config) => api.put(url, body, config).then((r) => r.data)
export const del = (url, config) => api.delete(url, config).then((r) => r.data)

// Fayl URL'ini to'liq manzilga aylantirish (/uploads/... -> https://server/uploads/...)
export const fileUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${SERVER_URL}${path.startsWith('/') ? '' : '/'}${path}`
}
