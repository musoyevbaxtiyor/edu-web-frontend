import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, ClipboardList, Video, FileText, Paperclip } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { RowsSkeleton } from '../../components/Skeletons'
import { Button, Modal, ConfirmDialog, EmptyState } from '../../components/ui'
import { useCourse, useLessons, useCreateLesson, useUpdateLesson, useDeleteLesson } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'

const EMPTY = {
  title: '',
  order: '',
  videoUrl: '',
  documentationUrl: '',
  taskFileUrl: '',
  taskDescription: '',
}

const FIELDS = [
  { key: 'title', label: 'Dars sarlavhasi', type: 'text', placeholder: 'Masalan: Kirish. React nima?' },
  { key: 'order', label: 'Tartib raqami', type: 'number', placeholder: '1' },
  { key: 'videoUrl', label: 'Video havolasi', type: 'text', placeholder: 'https://youtube.com/...' },
  { key: 'documentationUrl', label: 'Hujjat (dokumentatsiya) havolasi', type: 'text', placeholder: 'https://...' },
  { key: 'taskFileUrl', label: 'Vazifa fayli havolasi', type: 'text', placeholder: 'https://...' },
]

export default function LessonManager() {
  const { courseId } = useParams()
  const toast = useToast()
  const { data: course } = useCourse(courseId)
  const { data: lessons, isLoading } = useLessons(courseId)

  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()
  const deleteLesson = useDeleteLesson()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sorted = useMemo(
    () => [...(lessons || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [lessons],
  )

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY, order: String((lessons?.length || 0) + 1) })
    setModalOpen(true)
  }

  const openEdit = (lesson) => {
    setEditing(lesson)
    setForm({
      title: lesson.title || '',
      order: lesson.order != null ? String(lesson.order) : '',
      videoUrl: lesson.videoUrl || '',
      documentationUrl: lesson.documentationUrl || '',
      taskFileUrl: lesson.taskFileUrl || '',
      taskDescription: lesson.taskDescription || '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY)
  }

  const saving = createLesson.isPending || updateLesson.isPending

  const onSubmit = async (e) => {
    e.preventDefault()

    const title = form.title.trim()
    const videoUrl = form.videoUrl.trim()
    const documentationUrl = form.documentationUrl.trim()
    const taskFileUrl = form.taskFileUrl.trim()
    const taskDescription = form.taskDescription.trim()
    const order = Number(form.order)

    if (!title || !videoUrl || !documentationUrl || !taskFileUrl || !taskDescription || !String(form.order).trim()) {
      toast.error("Barcha maydonlarni to'ldiring")
      return
    }
    if (Number.isNaN(order) || order < 1) {
      toast.error("Tartib raqami 1 dan katta butun son bo'lishi kerak")
      return
    }

    const body = { title, course: courseId, order, videoUrl, documentationUrl, taskFileUrl, taskDescription }

    try {
      if (editing) {
        await updateLesson.mutateAsync({ id: editing._id, body })
        toast.success('Dars yangilandi')
      } else {
        await createLesson.mutateAsync(body)
        toast.success('Yangi dars qo\'shildi')
      }
      closeModal()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const onDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteLesson.mutateAsync(deleteTarget._id)
      toast.success("Dars o'chirildi")
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div>
      <Link to="/teach/courses" className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }}>
        <ArrowLeft /> Kurslarim
      </Link>

      <PageHeader
        title={`${course?.title || 'Kurs'} — darslar`}
        subtitle="Kurs darslarini qo'shing, tartiblang va tahrirlang."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Yangi dars
          </Button>
        }
      />

      {isLoading ? (
        <RowsSkeleton rows={5} />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Hali dars yo'q"
          message="Ushbu kursga birinchi darsni qo'shib, o'quv rejasini boshlang."
          action={
            <Button onClick={openCreate}>
              <Plus /> Birinchi darsni qo'shish
            </Button>
          }
        />
      ) : (
        <div className="stack gap-3">
          {sorted.map((lesson) => (
            <div key={lesson._id} className="card card-pad row gap-3" style={{ alignItems: 'center' }}>
              <span
                className="center"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  flexShrink: 0,
                  fontWeight: 800,
                  background: 'var(--brand-soft, rgba(99,102,241,0.12))',
                  color: 'var(--brand-600, var(--brand))',
                }}
              >
                {lesson.order ?? '—'}
              </span>

              <div className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }} className="truncate">{lesson.title}</div>
                {lesson.taskDescription && (
                  <div className="text-muted truncate" style={{ fontSize: '.84rem', marginTop: 2 }}>
                    {lesson.taskDescription}
                  </div>
                )}
                <div className="row gap-2 wrap" style={{ marginTop: 6 }}>
                  {lesson.videoUrl && <span className="badge badge-info"><Video /> Video</span>}
                  {lesson.documentationUrl && <span className="badge"><FileText /> Hujjat</span>}
                  {lesson.taskFileUrl && <span className="badge badge-warning"><Paperclip /> Vazifa</span>}
                </div>
              </div>

              <div className="row gap-2" style={{ flexShrink: 0 }}>
                <Button variant="secondary" size="sm" onClick={() => openEdit(lesson)}>
                  <Pencil /> Tahrirlash
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(lesson)}>
                  <Trash2 /> O'chirish
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Darsni tahrirlash' : 'Yangi dars'}
        size={560}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>Bekor qilish</Button>
            <Button onClick={onSubmit} loading={saving}>{editing ? 'Saqlash' : 'Qo\'shish'}</Button>
          </>
        }
      >
        <form onSubmit={onSubmit} className="stack gap-3">
          {FIELDS.map((f) => (
            <div key={f.key} className="field">
              <label className="label">{f.label}</label>
              <input
                className="input"
                type={f.type}
                min={f.type === 'number' ? 1 : undefined}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={set(f.key)}
              />
            </div>
          ))}

          <div className="field">
            <label className="label">Vazifa tavsifi</label>
            <textarea
              className="textarea"
              style={{ minHeight: 110 }}
              placeholder="O'quvchi bajarishi kerak bo'lgan vazifani tavsiflang..."
              value={form.taskDescription}
              onChange={set('taskDescription')}
            />
          </div>

          <button type="submit" style={{ display: 'none' }} aria-hidden="true" />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onDelete}
        title="Darsni o'chirish"
        message={deleteTarget ? `"${deleteTarget.title}" darsini o'chirishni tasdiqlaysizmi? Bu amalni ortga qaytarib bo'lmaydi.` : ''}
        loading={deleteLesson.isPending}
      />
    </div>
  )
}
