import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { get, post, put, del, api } from '../lib/api'

/* ============================================================
   Markazlashgan API hooklari (React Query)
   Har bir backend endpoint uchun bitta hook
   ============================================================ */

export const qk = {
  courses: ['courses'],
  course: (id) => ['course', id],
  teacherCourses: ['teacherCourses'],
  myCourses: ['myCourses'],
  lessons: (courseId) => ['lessons', courseId],
  statistics: ['statistics'],
  ratings: ['ratings'],
  notifications: ['notifications'],
  myScores: ['myScores'],
  profile: ['profile'],
  allUsers: ['allUsers'],
  tests: (params) => ['tests', params || {}],
  test: (id) => ['test', id],
  mySubmissions: ['mySubmissions'],
  mySubmission: (lessonId) => ['mySubmission', lessonId],
  teacherSubmissions: (kind) => ['teacherSubmissions', kind],
  reviewTasks: ['reviewTasks'],
  exams: (params) => ['exams', params || {}],
  exam: (id) => ['exam', id],
  myExamResults: ['myExamResults'],
}

/* ---------- Courses ---------- */
export const useCourses = () =>
  useQuery({ queryKey: qk.courses, queryFn: () => get('/courses').then((d) => d.courses || []) })

export const useCourse = (id) =>
  useQuery({ queryKey: qk.course(id), queryFn: () => get(`/courses/${id}`).then((d) => d.course), enabled: !!id })

export const useTeacherCourses = () =>
  useQuery({ queryKey: qk.teacherCourses, queryFn: () => get('/courses/teacher/me').then((d) => d.courses || []) })

export const useCreateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/courses', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teacherCourses })
      qc.invalidateQueries({ queryKey: qk.courses })
    },
  })
}

export const useUpdateCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => put(`/courses/${id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teacherCourses })
      qc.invalidateQueries({ queryKey: qk.courses })
    },
  })
}

export const useDeleteCourse = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(`/courses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teacherCourses })
      qc.invalidateQueries({ queryKey: qk.courses })
    },
  })
}

/* ---------- Enrollment ---------- */
export const useMyCourses = () =>
  useQuery({ queryKey: qk.myCourses, queryFn: () => get('/enroll/my-courses').then((d) => d.courses || []) })

export const useEnroll = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (courseId) => post('/enroll', { courseId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myCourses })
      qc.invalidateQueries({ queryKey: qk.statistics })
    },
  })
}

/* ---------- Lessons ---------- */
export const useLessons = (courseId) =>
  useQuery({
    queryKey: qk.lessons(courseId),
    queryFn: () => get(`/lessons/${courseId}`).then((d) => d.lessons || []),
    enabled: !!courseId,
  })

export const useCreateLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/lessons', body),
    onSuccess: (_, body) => qc.invalidateQueries({ queryKey: qk.lessons(body.course) }),
  })
}

export const useUpdateLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => put(`/lessons/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

export const useDeleteLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(`/lessons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })
}

/* ---------- Progress ---------- */
export const useStartLesson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ lessonId, courseId }) => post('/progress', { lessonId, courseId }),
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: qk.lessons(v.courseId) }),
  })
}

/* ---------- Submissions ---------- */
export const useSubmitTask = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ file, lessonId, courseId, submissionComment }) => {
      const form = new FormData()
      form.append('submissionFile', file)
      form.append('lessonId', lessonId)
      form.append('courseId', courseId)
      if (submissionComment) form.append('submissionComment', submissionComment)
      return api.post('/submissions', form).then((r) => r.data)
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: qk.lessons(v.courseId) })
      qc.invalidateQueries({ queryKey: qk.mySubmission(v.lessonId) })
      qc.invalidateQueries({ queryKey: qk.mySubmissions })
    },
  })
}

export const useMySubmission = (lessonId) =>
  useQuery({
    queryKey: qk.mySubmission(lessonId),
    queryFn: () => get(`/submissions/my/${lessonId}`).then((d) => d.submission),
    enabled: !!lessonId,
  })

export const useMySubmissions = () =>
  useQuery({ queryKey: qk.mySubmissions, queryFn: () => get('/submissions/my').then((d) => d.submissions || []) })

export const useTeacherSubmissions = (kind = 'all') =>
  useQuery({
    queryKey: qk.teacherSubmissions(kind),
    queryFn: () => get(`/submissions/teacher/${kind}`).then((d) => d.submissions || []),
  })

export const useReviewSubmission = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, ...body }) => put(`/submissions/review/${submissionId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.teacherSubmissions('all') })
      qc.invalidateQueries({ queryKey: qk.teacherSubmissions('pending') })
      qc.invalidateQueries({ queryKey: qk.notifications })
    },
  })
}

/* ---------- Users / stats / ratings ---------- */
export const useStatistics = (enabled = true) =>
  useQuery({ queryKey: qk.statistics, queryFn: () => get('/users/statistics'), enabled })

export const useRatings = () =>
  useQuery({ queryKey: qk.ratings, queryFn: () => get('/users/ratings').then((d) => d.ratings || []) })

export const useMyScores = (enabled = true) =>
  useQuery({ queryKey: qk.myScores, queryFn: () => get('/users/my-scores'), enabled })

export const useNotifications = () =>
  useQuery({
    queryKey: qk.notifications,
    queryFn: () => get('/users/notifications').then((d) => d.notifications || []),
    refetchInterval: 60_000,
  })

export const useUpdateProfile = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => put('/users/profile', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile }),
  })
}

/* ---------- Admin ---------- */
export const useAllUsers = () =>
  useQuery({ queryKey: qk.allUsers, queryFn: () => get('/users/admin/all').then((d) => d.users || []) })

export const useAdminSetPassword = () =>
  useMutation({
    mutationFn: ({ userId, newPassword }) => put(`/users/admin/${userId}/password`, { newPassword }),
  })

/* ---------- Tests ---------- */
export const useTests = (params) =>
  useQuery({
    queryKey: qk.tests(params),
    queryFn: () => get('/tests', { params }).then((d) => d.tests || []),
  })

export const useTest = (id) =>
  useQuery({ queryKey: qk.test(id), queryFn: () => get(`/tests/${id}`).then((d) => d.test), enabled: !!id })

export const useCheckAnswer = () =>
  useMutation({ mutationFn: ({ id, answerIndex }) => post(`/tests/${id}/check`, { answerIndex }) })

export const useCreateTest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/tests', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  })
}

export const useUpdateTest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => put(`/tests/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  })
}

export const useDeleteTest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(`/tests/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  })
}

/* ---------- Exams (Imtihonlar) ---------- */
export const useExams = (params) =>
  useQuery({
    queryKey: qk.exams(params),
    queryFn: () => get('/exams', { params }).then((d) => d.exams || []),
  })

export const useExam = (id) =>
  useQuery({ queryKey: qk.exam(id), queryFn: () => get(`/exams/${id}`).then((d) => d.exam), enabled: !!id })

export const useMyExamResults = (enabled = true) =>
  useQuery({ queryKey: qk.myExamResults, queryFn: () => get('/exams/my/results'), enabled })

export const useSubmitExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, answers }) => post(`/exams/${id}/submit`, { answers }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.myExamResults }),
  })
}

export const useCreateExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body) => post('/exams', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })
}

export const useUpdateExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }) => put(`/exams/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })
}

export const useDeleteExam = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => del(`/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams'] }),
  })
}

/* ---------- Telegram ---------- */
export const useTelegramToken = (enabled = false) =>
  useQuery({ queryKey: ['telegramToken'], queryFn: () => get('/telegram/token'), enabled })
