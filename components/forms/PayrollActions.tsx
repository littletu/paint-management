'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Calculator } from 'lucide-react'
import { calculatePayroll } from '@/lib/utils/payroll'
interface WorkerSummary {
  id: string
  hourly_rate: number
  overtime_rate: number
  profile_id?: string
  bank_account?: string | null
  notes?: string | null
  is_active?: boolean
}

interface Props {
  periodStart: string
  periodEnd: string
  workers: WorkerSummary[]
}

export function PayrollActions({ periodStart, periodEnd, workers }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCalculate() {
    if (!confirm(`確定要計算 ${periodStart} ~ ${periodEnd} 的薪資嗎？\n已存在的草稿將被重新計算。`)) return
    setLoading(true)

    for (const worker of workers) {
      const { data: entries } = await supabase
        .from('time_entries')
        .select('*')
        .eq('worker_id', worker.id)
        .gte('work_date', periodStart)
        .lte('work_date', periodEnd)

      if (!entries?.length) continue

      const payrollData = calculatePayroll(entries as any, worker as any, periodStart, periodEnd)

      await supabase.from('payroll_records').upsert({
        ...payrollData,
        status: 'draft',
      }, { onConflict: 'worker_id,period_start,period_end' })
    }

    toast.success('薪資計算完成')
    router.refresh()
    setLoading(false)
  }

  return (
    <Button size="sm" variant="outline" onClick={handleCalculate} disabled={loading}>
      <Calculator className="w-3.5 h-3.5 mr-1.5" />
      {loading ? '計算中...' : '計算薪資'}
    </Button>
  )
}
