import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Wallet } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: '待確認', confirmed: '已確認', paid: '已發薪',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline', confirmed: 'secondary', paid: 'default',
}

export default async function WorkerPayrollPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: worker } = await supabase
    .from('workers')
    .select('id, hourly_rate, overtime_rate')
    .eq('profile_id', user!.id)
    .single()

  if (!worker) return <div className="text-center py-12 text-gray-500">找不到師傅資料</div>

  const { data: records } = await supabase
    .from('payroll_records')
    .select('*')
    .eq('worker_id', worker.id)
    .order('period_start', { ascending: false })

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">我的薪資</h1>
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          <span>時薪：{formatCurrency(worker.hourly_rate)}</span>
          <span>加班時薪：{formatCurrency(worker.overtime_rate)}</span>
        </div>
      </div>

      {!records?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Wallet className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">尚無薪資記錄</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map(record => (
            <Card key={record.id} className="border-gray-100">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700">
                    {formatDate(record.period_start)} ~ {formatDate(record.period_end)}
                  </CardTitle>
                  <Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-orange-700 mb-0.5">實領金額</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(record.net_amount)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-400 mb-0.5">正常工時薪資</p>
                    <p className="font-medium text-gray-800">{formatCurrency(record.regular_amount)}</p>
                    <p className="text-gray-400">{record.regular_hours}h</p>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
