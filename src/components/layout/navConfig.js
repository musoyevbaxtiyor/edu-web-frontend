import {
  LayoutDashboard, BookOpen, GraduationCap, ClipboardList, Trophy, Bell,
  FolderKanban, FileCheck2, Users, BarChart3, Layers,
} from 'lucide-react'

// Rolga qarab yon menyu bo'limlari
export function navForRole(role) {
  const common = [
    { to: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
    { to: '/courses', label: 'Kurslar katalogi', icon: BookOpen },
  ]

  if (role === 'student') {
    return {
      main: [
        ...common,
        { to: '/my-courses', label: 'Mening kurslarim', icon: GraduationCap },
        { to: '/tests', label: 'Testlar', icon: ClipboardList },
      ],
      secondary: [
        { to: '/leaderboard', label: 'Reyting', icon: Trophy },
        { to: '/notifications', label: 'Bildirishnomalar', icon: Bell },
      ],
    }
  }

  if (role === 'teacher') {
    return {
      main: [
        { to: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
        { to: '/teach/courses', label: 'Kurslarim', icon: FolderKanban },
        { to: '/teach/submissions', label: 'Topshiriqlar', icon: FileCheck2 },
        { to: '/teach/tests', label: 'Testlar', icon: ClipboardList },
        { to: '/courses', label: 'Kurslar katalogi', icon: BookOpen },
      ],
      secondary: [
        { to: '/leaderboard', label: 'Reyting', icon: Trophy },
        { to: '/notifications', label: 'Bildirishnomalar', icon: Bell },
      ],
    }
  }

  // admin
  return {
    main: [
      { to: '/dashboard', label: 'Boshqaruv paneli', icon: LayoutDashboard },
      { to: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
      { to: '/admin/courses', label: 'Barcha kurslar', icon: Layers },
      { to: '/teach/submissions', label: 'Topshiriqlar', icon: FileCheck2 },
      { to: '/teach/tests', label: 'Testlar', icon: ClipboardList },
      { to: '/admin/analytics', label: 'Analitika', icon: BarChart3 },
    ],
    secondary: [
      { to: '/leaderboard', label: 'Reyting', icon: Trophy },
      { to: '/notifications', label: 'Bildirishnomalar', icon: Bell },
    ],
  }
}
