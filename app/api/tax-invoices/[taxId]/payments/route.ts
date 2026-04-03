import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ taxId: string }> }
) {
  const { taxId } = await params
  const supabase = await createClient()
  if (!await verifyAdmin(supabase)) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { payment_date, amount, notes } = await request.json()
  if (!amount || parseFloat(amount) <= 0) return NextResponse.json({ error: '請填寫收款金額' }, { status: 400 })

  const { error } = await supabase.from('invoice_payments').insert({
    tax_invoice_id: taxId,
    payment_date,
    amount: parseFloat(amount),
    notes: notes || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if the parent invoice is fully paid
  const { data: taxInvoice } = await supabase
    .from('invoice_tax_invoices')
    .select('invoice_id, amount')
    .eq('id', taxId)
    .single()

  if (taxInvoice) {
    const { data: allTaxInvoices } = await supabase
      .from('invoice_tax_invoices')
      .select('id, amount, invoice_payments(amount)')
      .eq('invoice_id', taxInvoice.invoice_id)

    const { data: invoice } = await supabase
      .from('invoices')
      .select('total, status')
      .eq('id', taxInvoice.invoice_id)
      .single()

    if (allTaxInvoices && invoice && invoice.status !== 'paid' && invoice.status !== 'cancelled') {
      const totalPaid = allTaxInvoices.reduce((sum, ti) => {
        const tiPaid = (ti.invoice_payments as any[]).reduce((s: number, p: any) => s + (p.amount || 0), 0)
        return sum + tiPaid
      }, 0)
      if (totalPaid >= invoice.total) {
        await supabase.from('invoices')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', taxInvoice.invoice_id)
      } else if (invoice.status === 'draft') {
        await supabase.from('invoices').update({ status: 'sent' }).eq('id', taxInvoice.invoice_id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ taxId: string }> }
) {
  const { taxId } = await params
  const supabase = await createClient()
  if (!await verifyAdmin(supabase)) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ error: '缺少 paymentId' }, { status: 400 })

  const { error } = await supabase.from('invoice_payments')
    .delete().eq('id', paymentId).eq('tax_invoice_id', taxId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
