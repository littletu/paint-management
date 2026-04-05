import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { InvoicePrintButton } from '@/components/invoice/InvoicePrintButton'
import { InvoiceStatusActions } from '@/components/invoice/InvoiceStatusActions'
import { InvoicePayments } from '@/components/invoice/InvoicePayments'
import { InvoiceDeleteButton } from '@/components/invoice/InvoiceDeleteButton'
import { Pencil } from 'lucide-react'

const statusLabel: Record<string, string> = {
  draft: '草稿',
  sent: '已送出',
  paid: '已付款',
  cancelled: '已取消',
}

const statusClass: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: invoice }, { data: items }, { data: taxInvoices }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, customer:customers(name, contact_person, phone), project:projects(name)')
      .eq('id', id)
      .single(),
    supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order'),
    supabase
      .from('invoice_tax_invoices')
      .select('*, invoice_payments(*)')
      .eq('invoice_id', id)
      .order('tax_invoice_date'),
  ])

  if (!invoice) notFound()

  const customer = invoice.customer as { name: string; contact_person: string | null; phone: string | null } | null
  const project = invoice.project as { name: string } | null

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoice_number}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[invoice.status]}`}>
                {statusLabel[invoice.status]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InvoiceDeleteButton invoiceId={id} invoiceNumber={invoice.invoice_number} status={invoice.status} />
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <Link
              href={`/invoices/${id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              編輯
            </Link>
          )}
          <InvoiceStatusActions invoiceId={id} status={invoice.status} />
          <InvoicePrintButton />
        </div>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold text-gray-900">請款單</h1>
        <p className="text-gray-500">{invoice.invoice_number}</p>
      </div>

      <div className="space-y-6">
        {/* Invoice details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">請款單資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">發票人</p>
                <p className="font-semibold text-gray-900">妙根塗裝</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">請款單號</p>
                <p className="font-mono font-semibold text-gray-900">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">客戶</p>
                <p className="font-medium text-gray-900">{customer?.name ?? '—'}</p>
                {customer?.contact_person && (
                  <p className="text-sm text-gray-500">{customer.contact_person}</p>
                )}
                {customer?.phone && (
                  <p className="text-sm text-gray-500">{customer.phone}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">工程</p>
                <p className="font-medium text-gray-900">{project?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">開立日期</p>
                <p className="text-gray-900">{formatDate(invoice.issue_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">付款期限</p>
                <p className="text-gray-900">{invoice.due_date ? formatDate(invoice.due_date) : '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">請款明細</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">說明</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-500 font-medium">數量</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-500 font-medium">單價</th>
                  <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(items ?? []).map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900">{item.description}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-3 py-3 text-right text-gray-600">{formatCurrency(item.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="max-w-sm ml-auto space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>小計</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>稅額（{invoice.tax_rate}%）</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-gray-900 pt-3 border-t border-gray-200">
                <span>合計</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">備註</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        <div className="print:hidden">
          <InvoicePayments
            invoiceId={id}
            invoiceTotal={invoice.total}
            taxInvoices={(taxInvoices ?? []) as any}
          />
        </div>
      </div>
    </div>
  )
}
