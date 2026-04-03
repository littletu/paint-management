import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  // Verify admin auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const body = await request.json()
  const { customer_id, project_id, issue_date, due_date, tax_rate, notes, items } = body

  // Generate invoice number (application-side, no RPC needed)
  const year = new Date().getFullYear()
  const { count, error: countError } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `INV-${year}-%`)
  if (countError) return NextResponse.json({ error: `資料庫錯誤（invoices 資料表可能尚未建立）：${countError.message}` }, { status: 500 })
  const seq = ((count ?? 0) + 1).toString().padStart(4, '0')
  const invoice_number = `INV-${year}-${seq}`

  // Calculate totals
  const subtotal: number = (items as Array<{ amount: number }>).reduce((s, it) => s + (it.amount || 0), 0)
  const taxRateNum = parseFloat(tax_rate) || 0
  const tax_amount = subtotal * (taxRateNum / 100)
  const total = subtotal + tax_amount

  // Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number,
      customer_id: customer_id || null,
      project_id: project_id || null,
      issue_date,
      due_date: due_date || null,
      subtotal,
      tax_rate: taxRateNum,
      tax_amount,
      total,
      status: 'draft',
      notes: notes || null,
      created_by: user.id,
    })
    .select('id, invoice_number')
    .single()

  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

  // Insert line items
  if (items && items.length > 0) {
    const lineItems = (items as Array<{ description: string; quantity: number; unit_price: number; amount: number; sort_order: number }>).map(it => ({
      invoice_id: invoice.id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      amount: it.amount,
      sort_order: it.sort_order,
    }))

    const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ id: invoice.id, invoice_number: invoice.invoice_number })
}
