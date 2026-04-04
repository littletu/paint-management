'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  UserCog,
  Clock,
  Wallet,
  BookOpen,
  Receipt,
  ClipboardList,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: '儀表板', icon: LayoutDashboard },
  { href: '/customers', label: '客戶管理', icon: Users },
  { href: '/projects', label: '工程管理', icon: FolderOpen },
  { href: '/workers', label: '師傅管理', icon: UserCog },
  { href: '/time-reports', label: '工時報表', icon: Clock },
  { href: '/payroll', label: '薪資管理', icon: Wallet },
  { href: '/expenses', label: '開銷管理', icon: Receipt },
  { href: '/invoices', label: '請款管理', icon: ClipboardList },
  { href: '/accounting', label: '帳目總覽', icon: BookOpen },
  { href: '/system', label: '系統管理', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-700">
        <span className="font-bold text-lg leading-tight">妙根塗裝</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          登出
        </button>
      </div>
    </aside>
  )
}
