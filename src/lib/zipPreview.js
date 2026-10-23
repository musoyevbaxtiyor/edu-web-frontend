import { extOf, MIME } from './files'

/* ============================================================
   ZIP ichidagi HTML loyihani iframe'da ko'rsatish uchun yig'ish:
   nisbiy havolalardagi CSS/JS/rasmlar to'g'ridan-to'g'ri hujjatga
   joylanadi (data: URL va inline <style>/<script>).
   ============================================================ */

const isExternal = (ref) => !ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref.trim())

export function normalizePath(p) {
  const out = []
  for (const part of p.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') out.pop()
    else out.push(part)
  }
  return out.join('/')
}

const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '')

// files: Map<kichik harfli yo'l, entry>
export function findEntry(files, fromPath, ref) {
  if (isExternal(ref)) return null
  let clean = ref.trim().split(/[?#]/)[0]
  try {
    clean = decodeURI(clean)
  } catch {
    /* asl ko'rinishida qoldiramiz */
  }
  const candidates = clean.startsWith('/')
    ? [clean.slice(1), `${dirOf(fromPath).split('/')[0]}${clean}`] // ildizga nisbatan: zip ildizi yoki yuqori papka
    : [dirOf(fromPath) + clean]
  for (const c of candidates) {
    const hit = files.get(normalizePath(c).toLowerCase())
    if (hit) return hit
  }
  return null
}

const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g

async function inlineCssUrls(css, cssPath, files, dataUrl) {
  let out = css
  for (const m of [...css.matchAll(CSS_URL)]) {
    const e = findEntry(files, cssPath, m[2])
    if (e) out = out.split(m[0]).join(`url("${await dataUrl(e)}")`)
  }
  return out
}

export async function buildHtmlPreview(files, htmlPath) {
  const entry = files.get(htmlPath.toLowerCase())
  const doc = new DOMParser().parseFromString(await entry.text(), 'text/html')

  const cache = new Map()
  const dataUrl = async (e) => {
    if (!cache.has(e.path)) cache.set(e.path, await e.dataUrl())
    return cache.get(e.path)
  }

  for (const link of doc.querySelectorAll('link[href]')) {
    const e = findEntry(files, htmlPath, link.getAttribute('href'))
    if (!e) continue
    if ((link.getAttribute('rel') || '').toLowerCase().includes('stylesheet')) {
      const style = doc.createElement('style')
      style.textContent = await inlineCssUrls(await e.text(), e.path, files, dataUrl)
      link.replaceWith(style)
    } else {
      link.setAttribute('href', await dataUrl(e))
    }
  }

  for (const s of doc.querySelectorAll('script[src]')) {
    const e = findEntry(files, htmlPath, s.getAttribute('src'))
    if (!e) continue
    s.removeAttribute('src')
    // Skript ichidagi "</script" hujjatni buzmasligi uchun
    s.textContent = (await e.text()).replace(/<\/script/gi, '<\\/script')
  }

  for (const el of doc.querySelectorAll('[src], [poster]')) {
    for (const attr of ['src', 'poster']) {
      const e = el.hasAttribute(attr) && findEntry(files, htmlPath, el.getAttribute(attr))
      if (e) el.setAttribute(attr, await dataUrl(e))
    }
  }

  for (const style of doc.querySelectorAll('style')) {
    style.textContent = await inlineCssUrls(style.textContent, htmlPath, files, dataUrl)
  }
  for (const el of doc.querySelectorAll('[style]')) {
    el.setAttribute('style', await inlineCssUrls(el.getAttribute('style'), htmlPath, files, dataUrl))
  }

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

export const mimeOf = (path) => MIME[extOf(path)] || 'application/octet-stream'
