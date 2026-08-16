'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Wallet, UserCircle, ReceiptText, Lightbulb, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/worker/work-log', label: '填工時',   icon: ClipboardList, section: null,           role: null },
  { href: '/worker/payroll',  label: '薪資',     icon: Wallet,        section: null,           role: null },
  { href: '/worker/receipts', label: '發票',     icon: ReceiptText,   section: null,           role: null },
  { href: '/worker/issues',   label: '妙根老塞', icon: Lightbulb,     section: 'worker-issues', role: null },
  { href: '/worker/profile',  label: '個人資料', icon: UserCircle,    section: null,           role: null },
  { href: '/worker/manager',  label: '管理',     icon: Briefcase,     section: null,           role: 'manager' },
]

interface Props {
  allowedSections: string[] | null  // null = full access
  role: string
}

export function WorkerNav({ allowedSections, role }: Props) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item => {
    if (item.role && item.role !== role) return false
    return (
      item.section === null ||
      allowedSections === null ||
      allowedSections.includes(item.section)
    )
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10 safe-area-inset-bottom">
      {visibleItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className={cn(
              'flex-1 flex flex-col items-center py-3.5 gap-1.5 text-xs transition-colors active:scale-90 active:opacity-70',
              active ? 'text-orange-500' : 'text-gray-500'
            )}
          >
            <Icon className={cn('w-6 h-6 transition-transform', active && 'scale-110')} />
            <span className={cn('text-[13px] transition-colors', active && 'font-semibold')}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
