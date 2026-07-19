import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderKanban, Layers, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import CourseCard from '../../components/CourseCard'
import { GridSkeleton } from '../../components/Skeletons'
import { Button, Modal, ConfirmDialog, EmptyState } from '../../components/ui'
import { useTeacherCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'

const EMPTY_FORM = { title: '', description: '', price: 0, isPublished: false }

export default function CourseManager() {
  const toast = useToast()
  const { data: courses, isLoading } = useTeacherCourses()
  const createCourse = useCreateCourse()
  const updateCourse = useUpdateCourse()
  const deleteCourse = useDeleteCourse()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const setField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  const openEdit = (course) => {
    setEditing(course)
    setForm({
      title: course.title || '',
      description: course.description || '',
      price: course.price || 0,
      isPublished: !!course.isPublished,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (createCourse.isPending || updateCourse.isPending) return
    setModalOpen(false)
    setEditing(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Kurs nomini kiriting.')
      return
    }
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      isPublished: form.isPublished,
    }
    try {
      if (editing) {
        await updateCourse.mutateAsync({ id: editing._id, body })
        toast.success('Kurs yangilandi.')
      } else {
        await createCourse.mutateAsync(body)
        toast.success('Yangi kurs yaratildi.')
      }
      setModalOpen(false)
      setEditing(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const togglePublish = async (course) => {
    setTogglingId(course._id)
    try {
      await updateCourse.mutateAsync({ id: course._id, body: { isPublished: !course.isPublished } })
      toast.success(course.isPublished ? 'Kurs yashirildi.' : 'Kurs nashr qilindi.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCourse.mutateAsync(deleteTarget._id)
      toast.success('Kurs o\'chirildi.')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saving = createCourse.isPending || updateCourse.isPending

  return (
    <div>
      <PageHeader
        title="Kurslarim"
        subtitle="Kurslaringizni yarating, tahrirlang va darslarni tashkil qiling."
        actions={
          <Button onClick={openCreate}>
            <Plus /> Yangi kurs
          </Button>
        }
      />

      {isLoading ? (
        <GridSkeleton count={6} />
      ) : !courses?.length ? (
        <EmptyState
          icon={FolderKanban}
          title="Hali kurs yaratmagansiz"
          message="Birinchi kursingizni yarating va o'quvchilar uchun darslar qo'shishni boshlang."
          action={
            <Button onClick={openCreate}>
              <Plus /> Kurs yaratish
            </Button>
          }
        />
      ) : (
        <div className="grid-cards">
          {courses.map((c) => (
            <CourseCard
              key={c._id}
              course={c}
              to={`/teach/courses/${c._id}/lessons`}
              footer={
                <div className="stack gap-2">
                  <div className="row gap-2">
                    <Link to={`/teach/courses/${c._id}/lessons`} className="btn btn-secondary btn-sm grow">
                      <Layers /> Darslar
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                      <Pencil /> Tahrirlash
                    </Button>
                  </div>
                  <div className="row gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      block
                      loading={togglingId === c._id}
                      onClick={() => togglePublish(c)}
                    >
                      {c.isPublished ? <><EyeOff /> Yashirish</> : <><Eye /> Nashr qilish</>}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(c)}>
                      <Trash2 /> O'chirish
                    </Button>
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Kursni tahrirlash' : 'Yangi kurs'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal} disabled={saving}>
              Bekor qilish
            </Button>
            <Button onClick={submit} loading={saving}>
              {editing ? 'Saqlash' : 'Yaratish'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="stack gap-4">
          <div className="field">
            <label className="label">Kurs nomi</label>
            <input
              className="input"
              placeholder="Masalan: Web dasturlash asoslari"
              value={form.title}
              onChange={setField('title')}
              autoFocus
            />
          </div>

          <div className="field">
            <label className="label">Tavsif</label>
            <textarea
              className="textarea"
              rows={4}
              placeholder="Kurs haqida qisqacha ma'lumot..."
              value={form.description}
              onChange={setField('description')}
            />
          </div>

          <div className="field">
            <label className="label">Narxi (so'm)</label>
            <input
              className="input"
              type="number"
              min="0"
              step="1000"
              placeholder="0 — bepul"
              value={form.price}
              onChange={setField('price')}
            />
          </div>

          <label className="row gap-2" style={{ cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isPublished} onChange={setField('isPublished')} />
            <span>Kursni darhol nashr qilish</span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Kursni o'chirish"
        message={
          deleteTarget
            ? `"${deleteTarget.title}" kursini o'chirmoqchimisiz? Kursga tegishli darslar ham o'chishi mumkin.`
            : ''
        }
        loading={deleteCourse.isPending}
      />
    </div>
  )
}
