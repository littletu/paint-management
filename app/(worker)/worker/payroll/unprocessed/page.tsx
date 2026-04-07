import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/date'
import { TimeEntryEditRow } from '@/components/forms/TimeEntryEditRow'

export default async function UnprocessedPayrollPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const workerId = await getWorkerIdByProfileId(user.id)
  if (!workerId) redirect('/worker/payroll')

  const supabase = await createClient()

  const [{ data: worker }, { data: payrollRecords }, { data: allEntries }, { data: projects }] = await Promise.all([
    supabase.from('workers').select('id, daily_rate, overtime_rate').eq('id', workerId).single(),
    supabase.from('payroll_records').select('period_start, period_end').eq('worker_id', workerId),
    supabase.from('time_entries').select('*, project:projects(name)').eq('worker_id', workerId).order('work_date', { ascending: false }),
    supabase.from('projects').select('id, name').eq('status', 'active').order('name'),
  ])

  if (!worker) redirect('/worker/payroll')

  // Filter entries not covered by any payroll period
  const entries = (allEntries ?? []).filter(entry => {
    const d = entry.work_date
    return !(payrollRecords ?? []).some(r => d >= r.period_start && d <= r.period_end)
  })

  const totalDays = entries.reduce((s, e) => s + (e.regular_days ?? 0), 0)
  const totalOT = entries.reduce((s, e) => s + (e.overtime_hours ?? 0), 0)
  const estimatedRegular = totalDays * (worker.daily_rate ?? 0)
  const estimatedOT = totalOT * (worker.overtime_rate ?? 0)
  const estimatedTotal = estimatedRegular + estimatedOT

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link href="/worker/payroll" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">待計算工時</h1>
          <p className="text-xs text-gray-500 mt-0.5">尚未被計入薪資的工時紀錄</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Clock className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">目前沒有待計算的工時</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* 預估薪資摘要 */}
          <Card className="border-blue-200">
            <CardContent className="px-4 pt-4 pb-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center mb-3">
                <p className="text-sm text-blue-700 mb-1">預估薪資（未含其他費用）</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(estimatedTotal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-400 mb-0.5">日薪預估</p>
                  <p className="font-medium text-gray-800">{formatCurrency(estimatedRegular)}</p>
                  <p className="text-gray-400">{totalDays} 天</p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-gray-400 mb-0.5">加班預估</p>
                  <p className="font-medium text-gray-800">{formatCurrency(estimatedOT)}</p>
                  <p className="text-gray-400">{totalOT} h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 每日工時明細（可編輯） */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-gray-700">每日工時明細</CardTitle>
                <span className="text-xs text-blue-500">共 {entries.length} 筆</span>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {entries.map((entry: any) => (
                <TimeEntryEditRow
                  key={entry.id}
                  entry={entry}
                  projects={projects ?? []}
                  canEdit={true}
                />
              ))}
              <div className="flex justify-between px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg">
                <span>合計工時</span>
                <span>合計 {totalDays} 天　加班 {totalOT} h</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
