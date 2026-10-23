import { api } from './api'

// Topshiriq fayllari token bilan (himoyalangan endpoint orqali) yuklab olinadi
export const submissionFileEndpoint = (id) => `/submissions/file/${id}`
export const practiceFileEndpoint = (id) => `/practice/submissions/${id}/file`

export const extOf = (name = '') => {
  const m = /\.([a-z0-9]+)$/i.exec(name)
  return m ? m[1].toLowerCase() : ''
}

export const baseName = (p = '') => p.split(/[\\/]/).pop() || p

// Content-Disposition sarlavhasidan fayl nomini olish (filename*=UTF-8''... ustun)
export function filenameFromHeader(header) {
  if (!header) return ''
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)
  if (star) {
    try {
      return decodeURIComponent(star[1].trim())
    } catch {
      /* oddiy filename ga o'tamiz */
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  return plain ? plain[1].trim() : ''
}

export async function fetchFile(endpoint) {
  const res = await api.get(endpoint, { responseType: 'blob', timeout: 120000 })
  return { blob: res.data, name: filenameFromHeader(res.headers['content-disposition']) }
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name || 'fayl'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const formatBytes = (n) => {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif']
export const TEXT_EXT = [
  'html', 'htm', 'css', 'scss', 'sass', 'less', 'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'md', 'txt',
  'xml', 'svg', 'yml', 'yaml', 'py', 'java', 'c', 'cpp', 'h', 'cs', 'php', 'rb', 'go', 'sql', 'sh', 'bat',
  'env', 'gitignore', 'vue', 'csv', 'ini', 'toml', 'log',
]

export const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', bmp: 'image/bmp', ico: 'image/x-icon', avif: 'image/avif',
  css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json',
  html: 'text/html', htm: 'text/html', pdf: 'application/pdf',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
  mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav',
}
