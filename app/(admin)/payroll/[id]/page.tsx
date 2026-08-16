import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { PayrollStatusActions } from '@/components/forms/PayrollStatusActions'
import { PayrollAdjustForm } from '@/components/forms/PayrollAdjustForm'
import { PayrollRecalcButton } from '@/components/forms/PayrollRecalcButton'
import { TimeEntryEditRow } from '@/components/forms/TimeEntryEditRow'

const statusLabel: Record<string, string> = { draft: '草稿', confirmed: '已確認', paid: '已發薪' }
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline', confirmed: 'secondary', paid: 'default',
}

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record } = await supabase
    .from('payroll_records')
    .select('*, worker:workers(daily_rate, overtime_rate, profile:profiles(full_name))')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const [{ data: entries }, { data: projects }] = await Promise.all([
    supabase
      .from('time_entries')
      .select('*, project:projects(name)')
      .eq('worker_id', record.worker_id)
      .gte('work_date', record.period_start)
      .lte('work_date', record.period_end)
      .order('work_date', { ascending: true }),
    supabase.from('projects').select('id, name').eq('status', 'active').order('name'),
  ])

  const worker = record.worker as any
  // 未發薪前，管理者可編輯每日工時；編輯後需按「重新計算」更新薪資總額
  const canEdit = record.status !== 'paid'

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/payroll" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">薪資明細</h1>
          <p className="text-sm text-gray-500">{worker?.profile?.full_name}</p>
        </div>
        <a
          href={`/api/payroll/slip?id=${id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          薪資單
        </a>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-gray-600">
              {formatDate(record.period_start)} ~ {formatDate(record.period_end)}
            </CardTitle>
            <div className="flex items-center gap-2">
              {canEdit && (
                <PayrollRecalcButton
                  recordId={id}
                  workerId={record.worker_id}
                  workerDailyRate={worker?.daily_rate ?? 0}
                  workerOvertimeRate={worker?.overtime_rate ?? 0}
                  periodStart={record.period_start}
                  periodEnd={record.period_end}
                  currentDeduction={record.deduction_amount ?? 0}
                />
              )}
              <Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-sm text-orange-700 mb-1">實領金額</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(record.net_amount)}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-600">日薪薪資</span>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(record.regular_amount)}</span>
                <span className="text-xs text-gray-400 ml-2">{record.regular_days}天 × {formatCurrency(worker?.daily_rate)}</span>
              </div>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-600">加班薪資</span>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(record.overtime_amount)}</span>
                <span className="text-xs text-gray-400 ml-2">{record.overtime_hours}h × {formatCurrency(worker?.overtime_rate)}</span>
              </div>
            </div>
            {record.transportation_total > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">交通費</span>
                <span className="font-medium">{formatCurrency(record.transportation_total)}</span>
              </div>
            )}
            {record.meal_total > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">餐費</span>
                <span className="font-medium">{formatCurrency(record.meal_total)}</span>
              </div>
            )}
            {record.advance_total > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">代墊費</span>
                <span className="font-medium">{formatCurrency(record.advance_total)}</span>
              </div>
            )}
            {record.subsidy_total > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">補貼</span>
                <span className="font-medium">{formatCurrency(record.subsidy_total)}</span>
              </div>
            )}
            {record.other_total > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">其他費用</span>
                <span className="font-medium">{formatCurrency(record.other_total)}</span>
              </div>
            )}
            {record.deduction_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-50 text-red-600">
                <span>扣款</span>
                <span className="font-medium">-{formatCurrency(record.deduction_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 font-bold text-base">
              <span>實領合計</span>
              <span className="text-orange-600">{formatCurrency(record.net_amount)}</span>
            </div>
          </div>

          {/* Daily breakdown — 每日工時明細（可編輯） */}
          {entries && entries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">每日工時明細</p>
                {canEdit ? (
                  <span className="text-xs text-orange-500">點筆可編輯，改完按「重新計算」</span>
                ) : (
                  <span className="text-xs text-gray-400">已發薪，無法修改</span>
                )}
              </div>
              <div className="space-y-2">
                {entries.map((entry: any) => (
                  <TimeEntryEditRow
                    key={entry.id}
                    entry={entry}
                    projects={projects ?? []}
                    canEdit={canEdit}
                  />
                ))}
                <div className="flex justify-between px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg">
                  <span>合計工時</span>
                  <span>合計 {record.regular_days}天　加班 {record.overtime_hours}h</span>
                </div>
              </div>
            </div>
          )}

          {record.notes && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{record.notes}</p>
          )}

          <PayrollAdjustForm
            recordId={id}
            currentDeduction={record.deduction_amount ?? 0}
            currentNotes={record.notes}
            currentNetAmount={record.net_amount}
            disabled={record.status === 'paid'}
          />

          <PayrollStatusActions recordId={id} currentStatus={record.status} />
        </CardContent>
      </Card>
    </div>
  )
}
