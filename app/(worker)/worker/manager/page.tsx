import Link from 'next/link'
import { UserPlus, FolderPlus, Building2 } from 'lucide-react'

export default async function ManagerHubPage() {

  const actions = [
    {
      href: '/worker/manager/new-customer',
      icon: Building2,
      label: '新增客戶',
      desc: '建立新客戶資料',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      href: '/worker/manager/new-project',
      icon: FolderPlus,
      label: '新增專案',
      desc: '開立新工程專案',
      color: 'bg-orange-50 text-orange-600',
    },
    {
      href: '/worker/manager/new-worker',
      icon: UserPlus,
      label: '新增員工',
      desc: '建立師傅帳號',
      color: 'bg-green-50 text-green-600',
    },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-5">管理</h1>
      <div className="space-y-3">
        {actions.map(({ href, icon: Icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
