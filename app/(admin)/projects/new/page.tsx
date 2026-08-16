import { createClient } from '@/lib/supabase/server'
import { ProjectForm } from '@/components/forms/ProjectForm'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const [{ data: customers }, { data: paymentStatuses }] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('payment_statuses').select('id, label, color, sort_order').order('sort_order'),
  ])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新增工程</h1>
      </div>
      <ProjectForm customers={customers ?? []} paymentStatuses={paymentStatuses ?? []} />
    </div>
  )
}
