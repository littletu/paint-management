import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Clock } from 'lucide-react'

export default async function WorkerHistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('profile_id', user!.id)
    .single()

  if (!worker) return <div className="text-center py-12 text-gray-500">找不到師傅資料</div>

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, project:projects(name)')
    .eq('worker_id', worker.id)
    .order('work_date', { ascending: false })
    .limit(60)

  // Group by month
  const grouped: Record<string, typeof entries> = {}
  for (const entry of entries ?? []) {
    const month = (entry.work_date as string).slice(0, 7)
    if (!grouped[month]) grouped[month] = []
    grouped[month]!.push(entry)
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">工時歷史</h1>
        <p className="text-sm text-gray-500 mt-0.5">近 60 筆記錄</p>
      </div>

      {!entries?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">尚無工時記錄</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([month, monthEntries]) => {
            const totalHours = monthEntries!.reduce((s, e) => s + (e.regular_hours || 0) + (e.overtime_hours || 0), 0)
            const totalFees = monthEntries!.reduce((s, e) =>
              s + (e.transportation_fee || 0) + (e.meal_fee || 0) + (e.advance_payment || 0) + (e.subsidy || 0) + (e.other_fee || 0), 0)

            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-gray-700">{month.replace('-', ' 年 ')} 月</h2>
                  <span className="text-xs text-gray-500">共 {totalHours}h ／ 費用 {formatCurrency(totalFees)}</span>
                </div>
                <div className="space-y-2">
                  {monthEntries!.map((entry: any) => {
                    const dailyFees = (entry.transportation_fee || 0) + (entry.meal_fee || 0) +
                      (entry.advance_payment || 0) + (entry.subsidy || 0) + (entry.other_fee || 0)
                    return (
                      <Card key={entry.id} className="border-gray-100">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{formatDate(entry.work_date)}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{(entry.project as any)?.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                正常 {entry.regular_hours}h
                                {entry.overtime_hours > 0 && ` ／ 加班 ${entry.overtime_hours}h`}
                              </p>
                              {dailyFees > 0 && (
                                <p className="text-xs text-gray-500">{formatCurrency(dailyFees)} 費用</p>
                              )}
                            </div>
                          </div>
                          {entry.work_progress && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 rounded p-2 leading-relaxed">
                              {entry.work_progress}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
