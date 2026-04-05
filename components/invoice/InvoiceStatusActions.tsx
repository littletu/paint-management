'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  invoiceId: string
  status: string
}

export function InvoiceStatusActions({ invoiceId, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  async function updateStatus(newStatus: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? '更新失敗')
      } else {
        const labels: Record<string, string> = {
          sent: '已標記為已送出',
          paid: '已標記為已付款',
          cancelled: '已取消請款單',
        }
        toast.success(labels[newStatus] ?? '狀態已更新')
        router.refresh()
      }
    } catch {
      toast.error('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
      setConfirmCancel(false)
    }
  }

  return (
    <div className="flex items-center gap-2 print:hidden">
      {status === 'draft' && (
        <Button
          onClick={() => updateStatus('sent')}
          disabled={loading}
          size="sm"
          variant="outline"
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          標記為已送出
        </Button>
      )}
      {status === 'sent' && (
        <Button
          onClick={() => updateStatus('paid')}
          disabled={loading}
          size="sm"
          variant="outline"
          className="border-green-300 text-green-700 hover:bg-green-50"
        >
          標記為已付款
        </Button>
      )}
      {(status === 'draft' || status === 'sent' || status === 'paid') && (
        confirmCancel ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">確定取消？</span>
            <Button
              onClick={() => updateStatus('cancelled')}
              disabled={loading}
              size="sm"
              variant="destructive"
            >
              確定
            </Button>
            <Button
              onClick={() => setConfirmCancel(false)}
              disabled={loading}
              size="sm"
              variant="ghost"
            >
              返回
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setConfirmCancel(true)}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="text-red-600 hover:bg-red-50"
          >
            取消
          </Button>
        )
      )}
    </div>
  )
}
