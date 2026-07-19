import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'https://edu-web-backend.onrender.com/api'

// Fayl (uploads) manzillari uchun server ildizi (/api siz)
export const SERVER_URL = BASE_URL.replace(/\/api\/?$/, '')

const TOKEN_KEY = 'eduweb_token'

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
  (error) => {
    const status = error.response?.status
    const serverMsg = error.response?.data?.message
    let message = serverMsg

    if (!error.response) {
      message = "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring."
    } else if (status === 401) {
      // Token yaroqsiz — sessiyani tozalaymiz (login sahifasi hal qiladi)
      if (!error.config?.url?.includes('/auth/login')) {
        setToken(null)
      }
      message = message || 'Sessiya tugadi. Iltimos, qaytadan kiring.'
    } else if (status === 403) {
      message = message || "Bu amalni bajarishga ruxsatingiz yo'q."
    } else if (status >= 500) {
      message = message || 'Serverda xatolik yuz berdi. Birozdan so\'ng urinib ko\'ring.'
    }

    return Promise.reject(new Error(message || 'Kutilmagan xatolik yuz berdi.'))
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
