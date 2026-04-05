import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// PUT /api/invoices/[id] — full update (content + line items)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const body = await request.json()
  const { customer_id, project_id, issue_date, due_date, tax_rate, notes, items } = body

  const subtotal: number = (items as Array<{ amount: number }>).reduce((s, it) => s + (it.amount || 0), 0)
  const taxRateNum = parseFloat(tax_rate) || 0
  const tax_amount = subtotal * (taxRateNum / 100)
  const total = subtotal + tax_amount

  const { error: invoiceError } = await supabase
    .from('invoices')
    .update({
      customer_id: customer_id || null,
      project_id: project_id || null,
      issue_date,
      due_date: due_date || null,
      subtotal,
      tax_rate: taxRateNum,
      tax_amount,
      total,
      notes: notes || null,
    })
    .eq('id', id)

  if (invoiceError) return NextResponse.json({ error: invoiceError.message }, { status: 500 })

  // Replace line items: delete all → insert new
  const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  if (items && items.length > 0) {
    const lineItems = (items as Array<{ description: string; quantity: number; unit_price: number; amount: number; sort_order: number }>).map(it => ({
      invoice_id: id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      amount: it.amount,
      sort_order: it.sort_order,
    }))
    const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems)
    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ id })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const { status } = body

  const updateData: Record<string, unknown> = { status }
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const { data: invoice } = await supabase.from('invoices').select('status').eq('id', id).single()
  if (!invoice) return NextResponse.json({ error: '找不到請款單' }, { status: 404 })
  if (!['draft', 'cancelled'].includes(invoice.status)) return NextResponse.json({ error: '只有草稿或已取消的請款單可以刪除' }, { status: 400 })

  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
