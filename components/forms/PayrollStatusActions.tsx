'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CheckCircle, Banknote } from 'lucide-react'

interface Props {
  recordId: string
  currentStatus: string
}

export function PayrollStatusActions({ recordId, currentStatus }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function updateStatus(status: string) {
    setLoading(true)
    const { error } = await supabase
      .from('payroll_records')
      .update({
        status,
        confirmed_at: status !== 'draft' ? new Date().toISOString() : null,
      })
      .eq('id', recordId)

    if (error) { toast.error('更新失敗：' + error.message); setLoading(false); return }
    toast.success(status === 'confirmed' ? '薪資已確認' : status === 'paid' ? '已標記發薪' : '已退回草稿')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2 pt-2">
      {currentStatus === 'draft' && (
        <Button onClick={() => updateStatus('confirmed')} disabled={loading} className="flex-1">
          <CheckCircle className="w-4 h-4 mr-2" />
          確認薪資
        </Button>
      )}
      {currentStatus === 'confirmed' && (
        <>
          <Button onClick={() => updateStatus('paid')} disabled={loading} className="flex-1">
            <Banknote className="w-4 h-4 mr-2" />
            標記已發薪
          </Button>
          <Button onClick={() => updateStatus('draft')} variant="outline" disabled={loading}>
            退回草稿
          </Button>
        </>
      )}
      {currentStatus === 'paid' && (
        <Button onClick={() => updateStatus('confirmed')} variant="outline" disabled={loading} size="sm">
          撤銷發薪
        </Button>
      )}
    </div>
  )
}
