import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { InvoiceForm } from '@/components/forms/InvoiceForm'

export default async function InvoiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: invoice },
    { data: items },
    { data: customers },
    { data: projects },
  ] = await Promise.all([
    supabase.from('invoices').select('*, customer:customers(id), project:projects(id)').eq('id', id).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('sort_order'),
    supabase.from('customers').select('id, name, contact_person, phone').order('name'),
    supabase.from('projects').select('id, name, customer_id').order('name'),
  ])

  if (!invoice) notFound()

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/invoices/${id}`} className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{invoice.invoice_number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">編輯請款單</p>
        </div>
      </div>

      <InvoiceForm
        customers={customers ?? []}
        projects={projects ?? []}
        editInvoiceId={id}
        defaultProjectId={invoice.project_id ?? undefined}
        defaultCustomerId={invoice.customer_id ?? undefined}
        defaultIssueDate={invoice.issue_date}
        defaultDueDate={invoice.due_date ?? undefined}
        defaultTaxRate={String(invoice.tax_rate ?? 0)}
        defaultNotes={invoice.notes ?? undefined}
        defaultItems={(items ?? []).map((it: any) => ({
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unit_price,
        }))}
      />
    </div>
  )
}
