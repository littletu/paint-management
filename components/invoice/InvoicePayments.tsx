'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2, Receipt, ChevronDown, ChevronRight, X } from 'lucide-react'
import { formatDate, formatCurrency, todayString } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

interface Payment {
  id: string
  payment_date: string
  amount: number
  notes: string | null
}

interface TaxInvoice {
  id: string
  tax_invoice_number: string
  tax_invoice_date: string
  amount: number
  notes: string | null
  invoice_payments: Payment[]
}

interface Props {
  invoiceId: string
  invoiceTotal: number
  taxInvoices: TaxInvoice[]
}

const emptyTaxForm = () => ({ tax_invoice_number: '', tax_invoice_date: todayString(), amount: '', notes: '' })
const emptyPayForm = () => ({ payment_date: todayString(), amount: '', notes: '' })

export function InvoicePayments({ invoiceId, invoiceTotal, taxInvoices: init }: Props) {
  const router = useRouter()
  const [taxInvoices, setTaxInvoices] = useState(init)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [showTaxForm, setShowTaxForm] = useState(false)
  const [showPayForm, setShowPayForm] = useState<Record<string, boolean>>({})
  const [taxForm, setTaxForm] = useState(emptyTaxForm())
  const [payForms, setPayForms] = useState<Record<string, ReturnType<typeof emptyPayForm>>>({})
  const [loading, setLoading] = useState(false)

  // Totals
  const totalIssued = taxInvoices.reduce((s, ti) => s + ti.amount, 0)
  const totalPaid = taxInvoices.reduce((s, ti) =>
    s + ti.invoice_payments.reduce((ps, p) => ps + p.amount, 0), 0)
  const remaining = invoiceTotal - totalPaid

  // Add tax invoice
  async function handleAddTaxInvoice(e: React.FormEvent) {
    e.preventDefault()
    if (!taxForm.tax_invoice_number.trim()) { toast.error('請填寫發票號碼'); return }
    if (!taxForm.amount || parseFloat(taxForm.amount) <= 0) { toast.error('請填寫金額'); return }
    setLoading(true)
    const res = await fetch(`/api/invoices/${invoiceId}/tax-invoices`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(taxForm),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '新增失敗'); setLoading(false); return }
    toast.success('統一發票已新增')
    // Update local state immediately so UI updates without needing router.refresh()
    setTaxInvoices(prev => [...prev, { ...data, invoice_payments: [] }])
    setTaxForm(emptyTaxForm())
    setShowTaxForm(false)
    setLoading(false)
    router.refresh()
  }

  // Delete tax invoice
  async function handleDeleteTaxInvoice(taxId: string) {
    const res = await fetch(`/api/invoices/${invoiceId}/tax-invoices?taxId=${taxId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '刪除失敗'); return }
    toast.success('已刪除')
    setTaxInvoices(prev => prev.filter(ti => ti.id !== taxId))
    router.refresh()
  }

  // Add payment to a tax invoice
  async function handleAddPayment(taxId: string, e: React.FormEvent) {
    e.preventDefault()
    const form = payForms[taxId] ?? emptyPayForm()
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('請填寫收款金額'); return }
    setLoading(true)
    const res = await fetch(`/api/tax-invoices/${taxId}/payments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '新增失敗'); setLoading(false); return }
    toast.success('收款記錄已新增')
    // Update local state immediately
    setTaxInvoices(prev => prev.map(ti =>
      ti.id === taxId
        ? { ...ti, invoice_payments: [...ti.invoice_payments, data] }
        : ti
    ))
    setPayForms(prev => ({ ...prev, [taxId]: emptyPayForm() }))
    setShowPayForm(prev => ({ ...prev, [taxId]: false }))
    setLoading(false)
    router.refresh()
  }

  // Delete payment
  async function handleDeletePayment(taxId: string, paymentId: string) {
    const res = await fetch(`/api/tax-invoices/${taxId}/payments?paymentId=${paymentId}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error ?? '刪除失敗'); return }
    toast.success('已刪除')
    setTaxInvoices(prev => prev.map(ti =>
      ti.id === taxId
        ? { ...ti, invoice_payments: ti.invoice_payments.filter(p => p.id !== paymentId) }
        : ti
    ))
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          統一發票 與 收款記錄
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Overall summary bar */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-500 mb-0.5">請款金額</p>
            <p className="font-semibold text-sm text-gray-900">{formatCurrency(invoiceTotal)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-500 mb-0.5">已開發票</p>
            <p className="font-semibold text-sm text-orange-700">{formatCurrency(totalIssued)}</p>
          </div>
          <div className={cn('rounded-lg p-2.5', remaining <= 0 ? 'bg-green-50' : 'bg-blue-50')}>
            <p className="text-xs text-gray-500 mb-0.5">已收款</p>
            <p className={cn('font-semibold text-sm', remaining <= 0 ? 'text-green-700' : 'text-blue-700')}>
              {formatCurrency(totalPaid)}
            </p>
          </div>
        </div>
        {remaining > 0 && (
          <p className="text-xs text-center text-gray-400">尚餘 {formatCurrency(remaining)} 未收</p>
        )}
        {remaining <= 0 && taxInvoices.length > 0 && (
          <p className="text-xs text-center text-green-600 font-medium">✓ 已全額收款</p>
        )}

        {/* Tax invoice list */}
        {taxInvoices.map((ti) => {
          const tiPaid = ti.invoice_payments.reduce((s, p) => s + p.amount, 0)
          const tiRemaining = ti.amount - tiPaid
          const isExpanded = expanded[ti.id] ?? true

          return (
            <div key={ti.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Tax invoice header */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setExpanded(prev => ({ ...prev, [ti.id]: !isExpanded }))}
              >
                <button type="button" className="text-gray-400 shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-sm text-gray-900">{ti.tax_invoice_number}</span>
                    <span className="text-xs text-gray-500">{formatDate(ti.tax_invoice_date)}</span>
                    {ti.notes && <span className="text-xs text-gray-400 truncate">{ti.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs">
                    <span className="text-gray-600">發票金額 {formatCurrency(ti.amount)}</span>
                    <span className="text-gray-300">·</span>
                    {tiRemaining <= 0
                      ? <span className="text-green-600 font-medium">已全額收款</span>
                      : <span className="text-orange-600">已收 {formatCurrency(tiPaid)}，尚餘 {formatCurrency(tiRemaining)}</span>
                    }
                  </div>
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleDeleteTaxInvoice(ti.id) }}
                  className="text-gray-300 hover:text-red-400 p-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Payments under this tax invoice */}
              {isExpanded && (
                <div className="px-4 py-3 space-y-2 bg-white">
                  {ti.invoice_payments.length === 0 && !showPayForm[ti.id] && (
                    <p className="text-xs text-gray-400 text-center py-2">尚無收款記錄</p>
                  )}

                  {ti.invoice_payments.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 px-3 bg-green-50 rounded-lg">
                      <div className="text-sm">
                        <span className="text-xs text-gray-400 mr-2">{idx + 1}.</span>
                        <span className="font-semibold text-green-800">{formatCurrency(p.amount)}</span>
                        <span className="text-xs text-gray-500 ml-2">{formatDate(p.payment_date)}</span>
                        {p.notes && <span className="text-xs text-gray-400 ml-2">· {p.notes}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(ti.id, p.id)}
                        className="text-gray-300 hover:text-red-400 p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add payment form */}
                  {showPayForm[ti.id] ? (
                    <form onSubmit={e => handleAddPayment(ti.id, e)} className="border border-green-200 rounded-lg p-3 bg-green-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-700">新增收款</p>
                        <button type="button" onClick={() => setShowPayForm(p => ({ ...p, [ti.id]: false }))} className="text-gray-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">收款日期</Label>
                          <Input type="date" className="h-7 text-xs"
                            value={payForms[ti.id]?.payment_date ?? todayString()}
                            onChange={e => setPayForms(prev => ({ ...prev, [ti.id]: { ...(prev[ti.id] ?? emptyPayForm()), payment_date: e.target.value } }))}
                            required />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">收款金額</Label>
                          <Input type="number" className="h-7 text-xs"
                            placeholder={tiRemaining > 0 ? String(tiRemaining) : '0'}
                            value={payForms[ti.id]?.amount ?? ''}
                            onChange={e => setPayForms(prev => ({ ...prev, [ti.id]: { ...(prev[ti.id] ?? emptyPayForm()), amount: e.target.value } }))}
                            min="0" step="1" required />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">備註（選填）</Label>
                          <Input className="h-7 text-xs"
                            placeholder="付款方式、說明等"
                            value={payForms[ti.id]?.notes ?? ''}
                            onChange={e => setPayForms(prev => ({ ...prev, [ti.id]: { ...(prev[ti.id] ?? emptyPayForm()), notes: e.target.value } }))}
                          />
                        </div>
                      </div>
                      <Button type="submit" size="sm" className="w-full h-7 text-xs" disabled={loading}>
                        {loading ? '新增中...' : '確認收款'}
                      </Button>
                    </form>
                  ) : (
                    tiRemaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPayForm(prev => ({ ...prev, [ti.id]: true }))}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-green-700 border border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        新增收款記錄
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Add new tax invoice form */}
        {showTaxForm ? (
          <form onSubmit={handleAddTaxInvoice} className="border border-orange-200 rounded-xl p-4 bg-orange-50 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">新增統一發票</p>
              <button type="button" onClick={() => setShowTaxForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">統一發票號碼 *</Label>
                <Input className="h-8 text-sm" placeholder="AB-12345678"
                  value={taxForm.tax_invoice_number}
                  onChange={e => setTaxForm(p => ({ ...p, tax_invoice_number: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">發票開立日期 *</Label>
                <Input type="date" className="h-8 text-sm"
                  value={taxForm.tax_invoice_date}
                  onChange={e => setTaxForm(p => ({ ...p, tax_invoice_date: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">發票金額 *</Label>
                <Input type="number" className="h-8 text-sm" placeholder="0" min="0" step="1"
                  value={taxForm.amount}
                  onChange={e => setTaxForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">備註</Label>
                <Input className="h-8 text-sm" placeholder="說明（選填）"
                  value={taxForm.notes}
                  onChange={e => setTaxForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <Button type="submit" size="sm" className="w-full" disabled={loading}>
              {loading ? '新增中...' : '新增統一發票'}
            </Button>
          </form>
        ) : (
          <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => setShowTaxForm(true)}>
            <Plus className="w-3.5 h-3.5" />
            新增統一發票
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
