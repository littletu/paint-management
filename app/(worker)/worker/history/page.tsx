import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { HistoryList } from '@/components/worker/HistoryList'

export default async function WorkerHistoryPage() {
  const user = await getAuthUser()
  if (!user) return null

  const workerId = await getWorkerIdByProfileId(user.id)
  if (!workerId) return <div className="text-center py-12 text-gray-500">找不到師傅資料</div>

  const supabase = await createClient()

  const [{ data: entries }, { data: payrollPeriods }] = await Promise.all([
    supabase
      .from('time_entries')
      .select('*, project:projects(name)')
      .eq('worker_id', workerId)
      .order('work_date', { ascending: false })
      .limit(30),
    supabase
      .from('payroll_records')
      .select('period_start, period_end')
      .eq('worker_id', workerId),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">工時歷史</h1>
        <p className="text-sm text-gray-500 mt-0.5">近 30 筆記錄</p>
      </div>

      {!entries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">尚無工時記錄</p>
          </CardContent>
        </Card>
      ) : (
        <HistoryList entries={entries as any} payrollPeriods={payrollPeriods ?? []} />
      )}
    </div>
  )
}
