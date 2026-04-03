import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '@/components/forms/InvoiceForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function NewInvoicePage() {
  const supabase = await createClient()

  const [{ data: customers }, { data: projects }] = await Promise.all([
    supabase.from('customers').select('id, name, contact_person, phone').order('name'),
    supabase.from('projects').select('id, name, customer_id').eq('status', 'active').order('name'),
  ])

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/invoices" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">新增請款單</h1>
        </div>
      </div>

      <InvoiceForm
        customers={customers ?? []}
        projects={projects ?? []}
      />
    </div>
  )
}
