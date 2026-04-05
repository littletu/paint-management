'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Wallet, UserCircle, ReceiptText, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/worker/work-log', label: '填工時',   icon: ClipboardList, section: null },
  { href: '/worker/payroll',  label: '薪資',     icon: Wallet,        section: null },
  { href: '/worker/receipts', label: '發票',     icon: ReceiptText,   section: null },
  { href: '/worker/issues',   label: '妙根老塞', icon: Lightbulb,     section: 'worker-issues' },
  { href: '/worker/profile',  label: '個人資料', icon: UserCircle,    section: null },
]

interface Props {
  allowedSections: string[] | null  // null = full access
}

export function WorkerNav({ allowedSections }: Props) {
  const pathname = usePathname()

  const visibleItems = navItems.filter(item =>
    item.section === null ||
    allowedSections === null ||
    allowedSections.includes(item.section)
  )

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
      {visibleItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors',
            pathname.startsWith(href) ? 'text-orange-500' : 'text-gray-500 hover:text-orange-500'
          )}
        >
          <Icon className="w-5 h-5" />
          {label}
        </Link>
      ))}
    </nav>
  )
}
