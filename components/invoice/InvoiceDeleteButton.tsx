'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export function InvoiceDeleteButton({ invoiceId, invoiceNumber, status }: { invoiceId: string; invoiceNumber: string; status: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error ?? '刪除失敗')
      setLoading(false)
      setConfirming(false)
      return
    }
    toast.success(`請款單 ${invoiceNumber} 已刪除`)
    router.push('/invoices')
    router.refresh()
  }

  if (status !== 'draft' && status !== 'cancelled') return null

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">確定刪除？</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? '刪除中...' : '確定'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={loading}
        >
          取消
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-red-500 hover:text-red-700 hover:border-red-300"
    >
      <Trash2 className="w-4 h-4 mr-1.5" />
      刪除
    </Button>
  )
}
