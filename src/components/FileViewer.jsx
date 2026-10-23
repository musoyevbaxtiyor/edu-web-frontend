import { useEffect, useMemo, useState } from 'react'
import JSZip from 'jszip'
import { Download, FileArchive, FileCode2, FileImage, FileText, File as FileIcon, AlertTriangle, Code2, MonitorPlay } from 'lucide-react'
import { Modal, Button, Spinner } from './ui'
import {
  fetchFile, saveBlob, extOf, baseName, formatBytes, IMAGE_EXT, TEXT_EXT,
} from '../lib/files'
import { buildHtmlPreview, mimeOf } from '../lib/zipPreview'

/* ============================================================
   Topshiriq faylini ko'rish oynasi (admin / o'qituvchi / o'quvchi)
   - fayl token bilan himoyalangan endpointdan olinadi
   - ZIP: ichidagi fayllar ro'yxati + kod / rasm / HTML natija
   - rasm, PDF, matnli fayllar — to'g'ridan-to'g'ri ko'rinadi
   ============================================================ */

const MAX_TEXT = 400 * 1024 // 400 KB dan katta matn qisqartiriladi
const JUNK = /(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$)/

const kindOf = (path) => {
  const ext = extOf(path)
  if (ext === 'html' || ext === 'htm') return 'html'
  if (IMAGE_EXT.includes(ext)) return 'image'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'zip') return 'zip'
  if (TEXT_EXT.includes(ext) || !ext) return 'text'
  return 'other'
}

const ICONS = { html: FileCode2, text: FileCode2, image: FileImage, pdf: FileText, zip: FileArchive, other: FileIcon }

const readDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

// Bitta fayl yoki ZIP ichidagi fayl uchun yagona interfeys
const blobEntry = (path, blob) => ({
  path,
  size: blob.size,
  blob: async () => new Blob([blob], { type: mimeOf(path) }),
  text: () => blob.text(),
  dataUrl: () => readDataUrl(new Blob([blob], { type: mimeOf(path) })),
})

const zipEntry = (file) => ({
  path: file.name,
  size: file._data?.uncompressedSize,
  blob: async () => new Blob([await file.async('blob')], { type: mimeOf(file.name) }),
  text: () => file.async('string'),
  dataUrl: async () => `data:${mimeOf(file.name)};base64,${await file.async('base64')}`,
})

// Avval ildizga yaqin index.html, keyin istalgan html, keyin birinchi fayl
function pickDefault(entries) {
  const byDepth = [...entries].sort((a, b) => a.path.split('/').length - b.path.split('/').length)
  return (
    byDepth.find((e) => /(^|\/)index\.html?$/i.test(e.path)) ||
    byDepth.find((e) => kindOf(e.path) === 'html') ||
    entries[0]
  )
}

function EntryPreview({ entry, files }) {
  const kind = kindOf(entry.path)
  const [mode, setMode] = useState(kind === 'html' ? 'render' : 'code')
  const [state, setState] = useState({ loading: true })

  useEffect(() => {
    let cancelled = false
    let objectUrl = null
    setState({ loading: true })
    ;(async () => {
      try {
        if (kind === 'image' || kind === 'pdf') {
          objectUrl = URL.createObjectURL(await entry.blob())
          if (!cancelled) setState({ url: objectUrl })
        } else if (kind === 'html' && mode === 'render') {
          const html = await buildHtmlPreview(files, entry.path)
          if (!cancelled) setState({ html })
        } else if (kind === 'html' || kind === 'text') {
          const text = await entry.text()
          if (!cancelled) setState({ text: text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}\n\n… (fayl qisqartirildi — to'liq ko'rish uchun yuklab oling)` : text })
        } else if (!cancelled) {
          setState({})
        }
      } catch (err) {
        if (!cancelled) setState({ error: err.message || "Faylni o'qib bo'lmadi." })
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [entry, files, kind, mode])

  const download = async () => saveBlob(await entry.blob(), baseName(entry.path))

  return (
    <div className="fv-preview">
      <div className="fv-preview-head">
        <div className="fv-path" title={entry.path}>{entry.path}</div>
        <div className="row gap-2">
          {kind === 'html' && (
            <div className="tabs fv-tabs">
              <button type="button" className={`tab ${mode === 'render' ? 'active' : ''}`} onClick={() => setMode('render')}>
                <MonitorPlay /> Natija
              </button>
              <button type="button" className={`tab ${mode === 'code' ? 'active' : ''}`} onClick={() => setMode('code')}>
                <Code2 /> Kod
              </button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={download}><Download /> Yuklab olish</Button>
        </div>
      </div>

      <div className="fv-preview-body">
        {state.loading ? (
          <Spinner label="Fayl ochilmoqda..." />
        ) : state.error ? (
          <div className="alert alert-danger">{state.error}</div>
        ) : state.url && kind === 'image' ? (
          <div className="fv-image"><img src={state.url} alt={baseName(entry.path)} /></div>
        ) : state.url && kind === 'pdf' ? (
          <iframe className="fv-frame" src={state.url} title={entry.path} />
        ) : state.html != null ? (
          // sandbox: allow-same-origin YO'Q — o'quvchi kodi sayt tokeniga yeta olmaydi
          <iframe className="fv-frame fv-frame-light" sandbox="allow-scripts allow-forms allow-modals" srcDoc={state.html} title={entry.path} />
        ) : state.text != null ? (
          <pre className="fv-code">{state.text}</pre>
        ) : (
          <div className="fv-empty">
            <FileIcon />
            <p>
              {extOf(entry.path) === 'rar'
                ? "RAR arxivni brauzerda ochib bo'lmaydi. Yuklab olib, kompyuterda oching."
                : "Bu turdagi faylni brauzerda ko'rsatib bo'lmaydi. Yuklab olib oching."}
            </p>
            <Button variant="secondary" size="sm" onClick={download}><Download /> Yuklab olish</Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FileViewer({ open, onClose, endpoint, fileName, title = "Topshiriq fayli" }) {
  const [state, setState] = useState({ loading: true })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!open || !endpoint) return undefined
    let cancelled = false
    setState({ loading: true })
    setSelected(null)
    ;(async () => {
      try {
        const { blob, name } = await fetchFile(endpoint)
        const fname = name || fileName || 'fayl'
        let entries
        let isZip = false
        if (kindOf(fname) === 'zip') {
          isZip = true
          let zip
          try {
            zip = await JSZip.loadAsync(blob)
          } catch {
            throw new Error("ZIP arxiv buzilgan yoki noto'g'ri formatda. Yuklab olib tekshirib ko'ring.")
          }
          entries = Object.values(zip.files)
            .filter((f) => !f.dir && !JUNK.test(f.name))
            .map(zipEntry)
            .sort((a, b) => a.path.localeCompare(b.path))
        } else {
          entries = [blobEntry(fname, blob)]
        }
        if (cancelled) return
        setState({ blob, name: fname, entries, isZip })
        setSelected(entries.length ? pickDefault(entries) : null)
      } catch (err) {
        if (!cancelled) setState({ error: err.message || "Faylni yuklab bo'lmadi." })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, endpoint, fileName])

  const files = useMemo(
    () => new Map((state.entries || []).map((e) => [e.path.toLowerCase(), e])),
    [state.entries],
  )

  const downloadAll = () => state.blob && saveBlob(state.blob, state.name)

  return (
    <Modal open={open} onClose={onClose} title={title} size={1180}>
      {state.loading ? (
        <Spinner label="Fayl yuklanmoqda..." />
      ) : state.error ? (
        <div className="stack gap-3">
          <div className="alert alert-danger row gap-2" style={{ alignItems: 'flex-start' }}>
            <AlertTriangle style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
            <span>{state.error}</span>
          </div>
        </div>
      ) : (
        <div className="stack gap-3">
          <div className="fv-head">
            <div className="row gap-2" style={{ alignItems: 'center', minWidth: 0 }}>
              <FileArchive style={{ width: 20, height: 20, flexShrink: 0, color: 'var(--brand-500)' }} />
              <div style={{ minWidth: 0 }}>
                <div className="fv-name" title={state.name}>{state.name}</div>
                <div className="text-muted" style={{ fontSize: '.78rem' }}>
                  {formatBytes(state.blob.size)}
                  {state.isZip && ` · ${state.entries.length} ta fayl`}
                </div>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={downloadAll}><Download /> Yuklab olish</Button>
          </div>

          {!state.entries.length ? (
            <div className="alert alert-warning">ZIP arxiv bo'sh.</div>
          ) : (
            <div className={state.isZip ? 'fv-layout' : ''}>
              {state.isZip && (
                <ul className="fv-list">
                  {state.entries.map((e) => {
                    const Icon = ICONS[kindOf(e.path)] || FileIcon
                    const dir = e.path.includes('/') ? e.path.slice(0, e.path.lastIndexOf('/') + 1) : ''
                    return (
                      <li key={e.path}>
                        <button
                          type="button"
                          className={`fv-item ${selected?.path === e.path ? 'active' : ''}`}
                          onClick={() => setSelected(e)}
                          title={e.path}
                        >
                          <Icon />
                          <span className="fv-item-name">
                            {dir && <span className="text-muted">{dir}</span>}
                            {baseName(e.path)}
                          </span>
                          {e.size != null && <span className="fv-item-size">{formatBytes(e.size)}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
              {selected && <EntryPreview key={selected.path} entry={selected} files={files} />}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
