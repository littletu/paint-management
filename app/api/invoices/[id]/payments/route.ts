import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const body = await request.json()
  const { payment_date, amount, tax_invoice_number, tax_invoice_date, notes } = body

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: '請輸入有效金額' }, { status: 400 })
  }

  const { error } = await supabase.from('invoice_payments').insert({
    invoice_id: invoiceId,
    payment_date,
    amount: parseFloat(amount),
    tax_invoice_number: tax_invoice_number || null,
    tax_invoice_date: tax_invoice_date || null,
    notes: notes || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check if fully paid — auto-update invoice status to 'paid'
  const { data: invoice } = await supabase
    .from('invoices')
    .select('total, status')
    .eq('id', invoiceId)
    .single()

  if (invoice && invoice.status !== 'paid' && invoice.status !== 'cancelled') {
    const { data: allPayments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', invoiceId)

    const paid = (allPayments ?? []).reduce((s: number, p: any) => s + (p.amount || 0), 0)
    if (paid >= invoice.total) {
      await supabase.from('invoices')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', invoiceId)
    } else if (invoice.status === 'draft') {
      // At least one payment means it's been sent/partially paid
      await supabase.from('invoices').update({ status: 'sent' }).eq('id', invoiceId)
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const paymentId = searchParams.get('paymentId')
  if (!paymentId) return NextResponse.json({ error: '缺少 paymentId' }, { status: 400 })

  const { error } = await supabase
    .from('invoice_payments')
    .delete()
    .eq('id', paymentId)
    .eq('invoice_id', invoiceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
