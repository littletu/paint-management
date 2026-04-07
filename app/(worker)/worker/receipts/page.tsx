import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { getCachedActiveProjects } from '@/lib/supabase/cached-data'
import { WorkerReceiptForm } from '@/components/forms/WorkerReceiptForm'
import { todayString } from '@/lib/utils/date'

export default async function WorkerReceiptsPage() {
  const user = await getAuthUser()
  if (!user) return null

  const workerId = await getWorkerIdByProfileId(user.id)

  if (!workerId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>找不到師傅資料，請聯絡管理者。</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [projects, { data: receipts }, { data: categories }] = await Promise.all([
    getCachedActiveProjects(),
    supabase.from('worker_receipts')
      .select('*, project:projects(name)')
      .eq('worker_id', workerId)
      .order('receipt_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30),
    supabase.from('expense_categories').select('id, name').eq('scope', 'project').order('sort_order'),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">發票上傳</h1>
        <p className="text-sm text-gray-500 mt-0.5">上傳工程相關發票與收據</p>
      </div>
      <WorkerReceiptForm
        workerId={workerId}
        workerProfileId={user.id}
        projects={projects}
        receipts={receipts ?? []}
        categories={categories ?? []}
        today={todayString()}
      />
    </div>
  )
}
