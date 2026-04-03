'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Receipt, X } from 'lucide-react'
import { formatDate, formatCurrency, todayString } from '@/lib/utils/date'

interface Payment {
  id: string
  payment_date: string
  amount: number
  tax_invoice_number: string | null
  tax_invoice_date: string | null
  notes: string | null
}

interface Props {
  invoiceId: string
  invoiceTotal: number
  payments: Payment[]
}

export function InvoicePayments({ invoiceId, invoiceTotal, payments: initialPayments }: Props) {
  const router = useRouter()
  const [payments, setPayments] = useState(initialPayments)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    payment_date: todayString(),
    amount: '',
    tax_invoice_number: '',
    tax_invoice_date: '',
    notes: '',
  })

  const paidTotal = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = invoiceTotal - paidTotal
  const paidPercent = invoiceTotal > 0 ? Math.min(100, (paidTotal / invoiceTotal) * 100) : 0

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('請輸入有效金額'); return }

    setLoading(true)
    const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '新增失敗'); setLoading(false); return }

    toast.success('收款記錄已新增')
    setForm({ payment_date: todayString(), amount: '', tax_invoice_number: '', tax_invoice_date: '', notes: '' })
    setShowForm(false)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(paymentId: string) {
    setDeletingId(paymentId)
    const res = await fetch(`/api/invoices/${invoiceId}/payments?paymentId=${paymentId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '刪除失敗') }
    else {
      toast.success('已刪除收款記錄')
      setPayments(prev => prev.filter(p => p.id !== paymentId))
      router.refresh()
    }
    setDeletingId(null)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          收款記錄
          <Badge variant={remaining <= 0 ? 'default' : 'secondary'} className={remaining <= 0 ? 'bg-green-600' : ''}>
            {remaining <= 0 ? '已全額收款' : `尚餘 ${formatCurrency(remaining)}`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>已收 {formatCurrency(paidTotal)}</span>
            <span>總計 {formatCurrency(invoiceTotal)}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${paidPercent}%` }}
            />
          </div>
        </div>

        {/* Payment list */}
        {payments.length > 0 && (
          <div className="divide-y divide-gray-50 border border-gray-100 rounded-lg overflow-hidden">
            {payments.map((p, i) => (
              <div key={p.id} className="flex items-start justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="font-semibold text-sm text-gray-900">{formatCurrency(p.amount)}</span>
                    {p.tax_invoice_number && (
                      <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5">
                        發票 {p.tax_invoice_number}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 ml-7 text-xs text-gray-500">
                    <span>收款日：{formatDate(p.payment_date)}</span>
                    {p.tax_invoice_date && <span>發票日：{formatDate(p.tax_invoice_date)}</span>}
                    {p.notes && <span>· {p.notes}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="text-gray-300 hover:text-red-400 p-1 ml-2 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add payment form */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="border border-orange-200 rounded-lg p-4 bg-orange-50 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-700">新增收款</p>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">收款日期</Label>
                <Input type="date" name="payment_date" value={form.payment_date} onChange={handleChange} className="h-8 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">收款金額（NT$）</Label>
                <Input type="number" name="amount" value={form.amount} onChange={handleChange}
                  placeholder={remaining > 0 ? String(remaining) : '0'}
                  min="0" step="1" className="h-8 text-sm" required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">統一發票號碼</Label>
                <Input name="tax_invoice_number" value={form.tax_invoice_number} onChange={handleChange}
                  placeholder="AB-12345678" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">發票開立日期</Label>
                <Input type="date" name="tax_invoice_date" value={form.tax_invoice_date} onChange={handleChange} className="h-8 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">備註</Label>
                <Input name="notes" value={form.notes} onChange={handleChange} placeholder="付款方式或備註" className="h-8 text-sm" />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? '新增中...' : '確認新增'}
            </Button>
          </form>
        ) : (
          remaining > 0 && (
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowForm(true)}>
              <Plus className="w-3.5 h-3.5" />
              新增收款記錄
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}
