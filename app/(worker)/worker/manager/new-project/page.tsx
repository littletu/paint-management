import { createClient } from '@/lib/supabase/server'
import { ManagerNewProjectForm } from './ManagerNewProjectForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function ManagerNewProjectPage() {
  const supabase = await createClient()
  const [{ data: customers }, { data: paymentStatuses }] = await Promise.all([
    supabase.from('customers').select('id, name').order('name'),
    supabase.from('payment_statuses').select('id, label, sort_order').order('sort_order'),
  ])

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/worker/manager" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">新增專案</h1>
      </div>
      <ManagerNewProjectForm
        customers={customers ?? []}
        paymentStatuses={paymentStatuses ?? []}
      />
    </div>
  )
}
