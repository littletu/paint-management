'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Wallet, UserCircle, ReceiptText, MessageSquareWarning } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/worker/work-log', label: '填工時',  icon: ClipboardList },
  { href: '/worker/payroll',  label: '薪資',    icon: Wallet },
  { href: '/worker/receipts', label: '發票',    icon: ReceiptText },
  { href: '/worker/issues',   label: '回報問題', icon: MessageSquareWarning },
  { href: '/worker/profile',  label: '個人資料', icon: UserCircle },
]

export function WorkerNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-10">
      {navItems.map(({ href, label, icon: Icon }) => (
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
