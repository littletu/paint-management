import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Wallet, ChevronRight, Pencil, AlertCircle, Clock } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: '待確認', confirmed: '已確認', paid: '已發薪',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline', confirmed: 'secondary', paid: 'default',
}

export default async function WorkerPayrollPage() {
  const user = await getAuthUser()
  if (!user) return null

  const workerId = await getWorkerIdByProfileId(user.id)
  if (!workerId) return <div className="text-center py-12 text-gray-500">找不到師傅資料</div>

  const supabase = await createClient()
  const [{ data: worker }, { data: records }, { data: allEntries }] = await Promise.all([
    supabase.from('workers').select('id, daily_rate, overtime_rate').eq('id', workerId).single(),
    supabase.from('payroll_records').select('*').eq('worker_id', workerId).order('period_start', { ascending: false }),
    supabase.from('time_entries').select('id, work_date, regular_days, overtime_hours').eq('worker_id', workerId).order('work_date', { ascending: false }),
  ])

  if (!worker) return <div className="text-center py-12 text-gray-500">找不到師傅資料</div>

  // Find time entries not covered by any payroll period
  const unprocessedEntries = (allEntries ?? []).filter(entry => {
    const d = entry.work_date
    return !(records ?? []).some(r => d >= r.period_start && d <= r.period_end)
  })
  const unprocessedDays = unprocessedEntries.reduce((s, e) => s + (e.regular_days ?? 0), 0)
  const unprocessedOT = unprocessedEntries.reduce((s, e) => s + (e.overtime_hours ?? 0), 0)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">我的薪資</h1>
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          <span>日薪：{formatCurrency(worker.daily_rate)}</span>
          <span>加班時薪：{formatCurrency(worker.overtime_rate)}</span>
        </div>
      </div>

      {/* 待計算工時 */}
      {unprocessedEntries.length > 0 && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-1.5 text-blue-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">待計算工時（{unprocessedEntries.length}筆）</span>
          </div>
          <Card className="border-blue-200 shadow-sm shadow-blue-50">
            <CardContent className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-blue-600 mb-0.5">工數</p>
                  <p className="text-xl font-bold text-blue-700">{unprocessedDays} 天</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-blue-600 mb-0.5">加班</p>
                  <p className="text-xl font-bold text-blue-700">{unprocessedOT} h</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">尚未被計入任何薪資週期</p>
              <Link
                href="/worker/payroll/unprocessed"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-xs font-semibold text-white transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                查看 / 編輯待計算工時
              </Link>
            </CardContent>
          </Card>
          {(records?.length ?? 0) > 0 && <div className="border-t border-gray-100 pt-1" />}
        </div>
      )}

      {!records?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Wallet className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">尚無薪資記錄</p>
          </CardContent>
        </Card>
      ) : (() => {
        const draftRecords = records.filter(r => r.status === 'draft')
        const otherRecords = records.filter(r => r.status !== 'draft')

        const RecordCard = ({ record }: { record: typeof records[0] }) => {
          const isDraft = record.status === 'draft'
          return (
            <Card key={record.id} className={isDraft ? 'border-orange-300 shadow-sm shadow-orange-100' : 'border-gray-100'}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    {formatDate(record.period_start)} ~ {formatDate(record.period_end)}
                  </CardTitle>
                  <Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className={`rounded-lg p-3 text-center ${isDraft ? 'bg-orange-50' : 'bg-gray-50'}`}>
                  <p className={`text-xs mb-0.5 ${isDraft ? 'text-orange-700' : 'text-gray-500'}`}>實領金額</p>
                  <p className={`text-2xl font-bold ${isDraft ? 'text-orange-600' : 'text-gray-800'}`}>{formatCurrency(record.net_amount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-400 mb-0.5">日薪薪資</p>
                    <p className="font-medium text-gray-800">{formatCurrency(record.regular_amount)}</p>
                    <p className="text-gray-400">{record.regular_days}天</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-400 mb-0.5">加班薪資</p>
                    <p className="font-medium text-gray-800">{formatCurrency(record.overtime_amount)}</p>
                    <p className="text-gray-400">{record.overtime_hours}h</p>
                  </div>
                  {record.transportation_total > 0 && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-400 mb-0.5">交通費</p>
                      <p className="font-medium text-gray-800">{formatCurrency(record.transportation_total)}</p>
                    </div>
                  )}
                  {record.meal_total > 0 && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-400 mb-0.5">餐費</p>
                      <p className="font-medium text-gray-800">{formatCurrency(record.meal_total)}</p>
                    </div>
                  )}
                  {record.advance_total > 0 && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-400 mb-0.5">代墊費</p>
                      <p className="font-medium text-gray-800">{formatCurrency(record.advance_total)}</p>
                    </div>
                  )}
                  {record.subsidy_total > 0 && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-400 mb-0.5">補貼</p>
                      <p className="font-medium text-gray-800">{formatCurrency(record.subsidy_total)}</p>
                    </div>
                  )}
                  {record.other_total > 0 && (
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-400 mb-0.5">其他費用</p>
                      <p className="font-medium text-gray-800">{formatCurrency(record.other_total)}</p>
                    </div>
                  )}
                  {record.deduction_amount > 0 && (
                    <div className="bg-red-50 rounded p-2">
                      <p className="text-red-400 mb-0.5">扣款</p>
                      <p className="font-medium text-red-700">-{formatCurrency(record.deduction_amount)}</p>
                    </div>
                  )}
                </div>

                {record.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">{record.notes}</p>
                )}
                {record.confirmed_at && (
                  <p className="text-xs text-gray-400">確認時間：{formatDate(record.confirmed_at)}</p>
                )}

                {isDraft ? (
                  <Link
                    href={`/worker/payroll/${record.id}`}
                    className="flex items-center justify-center gap-1.5 w-full mt-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-xs font-semibold text-white transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    確認 / 修改工時明細
                  </Link>
                ) : (
                  <Link
                    href={`/worker/payroll/${record.id}`}
                    className="flex items-center justify-center gap-1 w-full mt-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-xs font-medium text-gray-600 transition-colors"
                  >
                    查看每日明細
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </CardContent>
            </Card>
          )
        }

        return (
          <div className="space-y-4">
            {draftRecords.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-orange-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">待確認薪資（{draftRecords.length}筆）</span>
                </div>
                {draftRecords.map(record => <RecordCard key={record.id} record={record} />)}
                {otherRecords.length > 0 && <div className="border-t border-gray-100 pt-1" />}
              </div>
            )}
            {otherRecords.map(record => <RecordCard key={record.id} record={record} />)}
          </div>
        )
      })()}
    </div>
  )
}
