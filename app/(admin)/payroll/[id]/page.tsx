import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { PayrollStatusActions } from '@/components/forms/PayrollStatusActions'

const statusLabel: Record<string, string> = { draft: '草稿', confirmed: '已確認', paid: '已發薪' }
const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  draft: 'outline', confirmed: 'secondary', paid: 'default',
}

export default async function PayrollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record } = await supabase
    .from('payroll_records')
    .select('*, worker:workers(hourly_rate, overtime_rate, profile:profiles(full_name))')
    .eq('id', id)
    .single()

  if (!record) notFound()

  const worker = record.worker as any

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
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-gray-600">
              {formatDate(record.period_start)} ~ {formatDate(record.period_end)}
            </CardTitle>
            <Badge variant={statusVariant[record.status]}>{statusLabel[record.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <p className="text-sm text-orange-700 mb-1">實領金額</p>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(record.net_amount)}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-600">正常工時薪資</span>
              <div className="text-right">
                <span className="font-medium">{formatCurrency(record.regular_amount)}</span>
                <span className="text-xs text-gray-400 ml-2">{record.regular_hours}h × {formatCurrency(worker?.hourly_rate)}</span>
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

          {record.notes && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">{record.notes}</p>
          )}

          <PayrollStatusActions recordId={id} currentStatus={record.status} />
        </CardContent>
      </Card>
    </div>
  )
}
