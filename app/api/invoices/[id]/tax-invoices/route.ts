import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params
  const supabase = await createClient()
  if (!await verifyAdmin(supabase)) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { tax_invoice_number, tax_invoice_date, amount, notes } = await request.json()
  if (!tax_invoice_number?.trim()) return NextResponse.json({ error: '請填寫發票號碼' }, { status: 400 })
  if (!amount || parseFloat(amount) <= 0) return NextResponse.json({ error: '請填寫金額' }, { status: 400 })

  const { data, error } = await supabase.from('invoice_tax_invoices').insert({
    invoice_id: invoiceId,
    tax_invoice_number: tax_invoice_number.trim(),
    tax_invoice_date,
    amount: parseFloat(amount),
    notes: notes || null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: invoiceId } = await params
  const supabase = await createClient()
  if (!await verifyAdmin(supabase)) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const taxId = searchParams.get('taxId')
  if (!taxId) return NextResponse.json({ error: '缺少 taxId' }, { status: 400 })

  const { error } = await supabase.from('invoice_tax_invoices')
    .delete().eq('id', taxId).eq('invoice_id', invoiceId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
