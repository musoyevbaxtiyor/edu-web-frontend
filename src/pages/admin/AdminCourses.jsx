import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Layers, CheckCircle2, FileEdit, Eye, Trash2 } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import StatCard from '../../components/StatCard'
import { RowsSkeleton } from '../../components/Skeletons'
import { EmptyState, Button, ConfirmDialog } from '../../components/ui'
import { useCourses, useDeleteCourse } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatPrice } from '../../lib/utils'

const FILTERS = [
  { key: 'all', label: 'Barchasi' },
  { key: 'published', label: 'Nashr qilingan' },
  { key: 'draft', label: 'Qoralama' },
]

export default function AdminCourses() {
  const toast = useToast()
  const { data: courses, isLoading } = useCourses()
  const deleteCourse = useDeleteCourse()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [toDelete, setToDelete] = useState(null)

  const stats = useMemo(() => {
    const all = courses || []
    const published = all.filter((c) => c.isPublished).length
    return { total: all.length, published, draft: all.length - published }
  }, [courses])

  const list = useMemo(() => {
    let out = courses || []
    if (q.trim()) {
      const s = q.toLowerCase()
      out = out.filter(
        (c) =>
          c.title?.toLowerCase().includes(s) ||
          c.description?.toLowerCase().includes(s) ||
          c.teacher?.name?.toLowerCase().includes(s),
      )
    }
    if (filter === 'published') out = out.filter((c) => c.isPublished)
    if (filter === 'draft') out = out.filter((c) => !c.isPublished)
    return out
  }, [courses, q, filter])

  const onDelete = async () => {
    if (!toDelete) return
    try {
      await deleteCourse.mutateAsync(toDelete._id)
      toast.success(`"${toDelete.title}" kursi o'chirildi.`)
      setToDelete(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <PageHeader title="Barcha kurslar" subtitle="Platformadagi barcha kurslarni kuzating va boshqaring." />

      <div className="grid-stats" style={{ marginBottom: 24 }}>
        <StatCard icon={Layers} tone="brand" value={stats.total} label="Jami kurslar" />
        <StatCard icon={CheckCircle2} tone="mint" value={stats.published} label="Nashr qilingan" />
        <StatCard icon={FileEdit} tone="sunset" value={stats.draft} label="Qoralama" />
      </div>

      <div className="between wrap gap-3" style={{ marginBottom: 22 }}>
        <div className="input-group" style={{ maxWidth: 360, flex: 1 }}>
          <Search />
          <input
            className="input"
            placeholder="Kurs yoki o'qituvchi qidirish..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="tabs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <RowsSkeleton rows={6} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Kurs topilmadi"
          message={
            q || filter !== 'all'
              ? "Filtr bo'yicha kurs topilmadi. Boshqa shart bilan urinib ko'ring."
              : 'Hozircha platformada kurslar mavjud emas.'
          }
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Kurs</th>
                <th>O'qituvchi</th>
                <th style={{ textAlign: 'right' }}>Narx</th>
                <th>Holat</th>
                <th>Sana</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ minWidth: 0, maxWidth: 340 }}>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      {c.description && (
                        <div className="text-muted truncate" style={{ fontSize: '.78rem' }}>
                          {c.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.86rem' }}>{c.teacher?.name || '—'}</div>
                      {c.teacher?.email && (
                        <div className="text-muted" style={{ fontSize: '.76rem', wordBreak: 'break-word' }}>
                          {c.teacher.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatPrice(c.price)}</td>
                  <td>
                    {c.isPublished ? (
                      <span className="badge badge-success">Nashr</span>
                    ) : (
                      <span className="badge badge-warning">Qoralama</span>
                    )}
                  </td>
                  <td className="text-muted" style={{ fontSize: '.82rem', whiteSpace: 'nowrap' }}>
                    {formatDate(c.createdAt)}
                  </td>
                  <td>
                    <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                      <Button as={Link} to={`/courses/${c._id}`} variant="secondary" size="sm">
                        <Eye /> Ko'rish
                      </Button>
                      <Button variant="danger" size="sm" className="btn-icon" onClick={() => setToDelete(c)} aria-label="O'chirish">
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={onDelete}
        loading={deleteCourse.isPending}
        title="Kursni o'chirish"
        message={`"${toDelete?.title}" kursini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
      />
    </div>
  )
}
