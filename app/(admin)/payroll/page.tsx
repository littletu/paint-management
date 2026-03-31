import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, currentYearMonth } from '@/lib/utils/date'
import { getBiweeklyPeriods } from '@/lib/utils/payroll'
import { PayrollActions } from '@/components/forms/PayrollActions'
import Link from 'next/link'
import { Wallet } from 'lucide-react'

interface SearchParams { year?: string; month?: string }

const statusLabel: Record<string, string> = { draft: '草稿', confirmed: '已確認', paid: '已發薪' }
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline', confirmed: 'secondary', paid: 'default',
}

export default async function PayrollPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const { year: curYear, month: curMonth } = currentYearMonth()
  const year = parseInt(sp.year ?? String(curYear))
  const month = parseInt(sp.month ?? String(curMonth))

  const supabase = await createClient()
  const periods = getBiweeklyPeriods(year, month)

  const { data: workers } = await supabase
    .from('workers')
    .select('id, hourly_rate, overtime_rate, profile:profiles(full_name)')
    .eq('is_active', true) as { data: Array<{ id: string; hourly_rate: number; overtime_rate: number; profile: any }> | null }

  // Load payroll records for this month
  const { data: records } = await supabase
    .from('payroll_records')
    .select('*')
    .gte('period_start', `${year}-${String(month).padStart(2, '0')}-01`)
    .lte('period_end', `${year}-${String(month).padStart(2, '0')}-31`)

  // recordMap not used directly; lookup via find below

  // Month selector options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(curYear, curMonth - 1 - i, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">薪資管理</h1>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          defaultValue={`${year}-${month}`}
          onChange={e => {
            const [y, m] = e.target.value.split('-')
            window.location.href = `/payroll?year=${y}&month=${m}`
          }}
        >
          {monthOptions.map(o => (
            <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
              {o.year} 年 {o.month} 月
            </option>
          ))}
        </select>
      </div>

      {periods.map(period => (
        <div key={period.start} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{period.label}</h2>
            <PayrollActions
              periodStart={period.start}
              periodEnd={period.end}
              workers={workers ?? []}
            />
          </div>

          <div className="space-y-3">
            {(workers ?? []).map((worker: any) => {
              const record = records?.find(r => r.worker_id === worker.id && r.period_start === period.start)
              return (
                <Card key={worker.id} className={record ? '' : 'opacity-60'}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{(worker.profile as any)?.full_name}</p>
                      <p className="text-xs text-gray-500">
                        時薪 {formatCurrency(worker.hourly_rate)} ／ 加班 {formatCurrency(worker.overtime_rate)}
                      </p>
                    </div>
                    {record ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{formatCurrency(record.net_amount)}</p>
                          <p className="text-xs text-gray-500">{record.regular_hours}h 正常 ＋ {record.overtime_hours}h 加班</p>
                        </div>
                        <Link href={`/payroll/${record.id}`}>
                          <Badge variant={statusVariant[record.status]} className="cursor-pointer">
                            {statusLabel[record.status]}
                          </Badge>
                        </Link>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">尚未計算</span>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
