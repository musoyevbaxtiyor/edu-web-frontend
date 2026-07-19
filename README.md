# Edu Web — React Frontend (v2)

Bu — `edu-web` onlayn ta'lim platformasining **React (Vite)** ga ko'chirilgan zamonaviy frontendi.
Eski vanilla JS versiyasi (`../edu-web-frontend`) zaxira sifatida saqlanadi.

## Texnologiyalar

- **React 18 + Vite** — tez ishlab chiqish va optimizatsiyalangan build
- **React Router v6** — sahifalar navigatsiyasi (lazy-loaded)
- **TanStack Query (React Query)** — server holati, keshlash, avtomatik yangilanish
- **Axios** — token bilan avtomatik so'rovlar va xatoliklarni bir xillashtirish
- **lucide-react** — ikonlar, **recharts** — analitika grafiklari
- Maxsus **design system** (CSS o'zgaruvchilari) — yorug'/qorong'i rejim, to'liq responsive

## Ishga tushirish

```bash
npm install
npm run dev        # http://localhost:5173
```

Backend manzilini `.env` faylida sozlang:

```
VITE_API_URL=http://localhost:10000/api      # local backend
# yoki
VITE_API_URL=https://edu-web-backend.onrender.com/api
```

Production build:

```bash
npm run build      # dist/ papkasiga
npm run preview    # buildni tekshirish
```

## Tuzilma

```
src/
  main.jsx              # Provider'lar (Router, Query, Theme, Toast, Auth)
  App.jsx               # Marshrutlar + rol guardlar
  lib/                  # api (axios), utils, queryClient
  context/              # Auth, Theme, Toast
  hooks/useApi.js       # Barcha backend endpointlari uchun React Query hooklari
  components/
    ui/                 # Button, Modal, ConfirmDialog, Avatar, Spinner, EmptyState
    layout/             # AppShell, Sidebar, Topbar, guards, navConfig
    CourseCard, StatCard, PageHeader, Skeletons
  pages/                # Landing, auth, Dashboard, Courses, LessonView, Tests, ...
    teacher/            # CourseManager, LessonManager, Submissions, TestManager
    admin/              # Users, AdminCourses, Analytics
  styles/               # tokens.css, base.css, components.css (design system)
```

## Rollar va imkoniyatlar

| Rol | Imkoniyatlar |
|-----|-------------|
| **O'quvchi** | Kurslarga yozilish, video darslar, vazifa topshirish, testlar, reyting, coinlar |
| **O'qituvchi** | Kurs/dars CRUD, vazifalarni baholash (ball + coin), test yaratish |
| **Admin** | Foydalanuvchilar, barcha kurslar, analitika, parol boshqaruvi |

## Qulay funksiyalar

- 🌗 Qorong'i / yorug' rejim (avtomatik aniqlash + qo'lda almashtirish)
- 📱 Barcha qurilmalarga moslashuvchan (mobil, planshet, desktop)
- 🔔 Bildirishnomalar markazi
- 🏆 Reyting va coin tizimi
- ⚡ Lazy-loading va keshlash bilan tez ishlash
