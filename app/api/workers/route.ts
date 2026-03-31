import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Verify caller is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未授權' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: '權限不足' }, { status: 403 })

  const body = await request.json()
  const { full_name, phone, email, password, hourly_rate, overtime_rate, bank_account, notes } = body

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }

  // Create user with service role (bypasses email confirmation)
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role: 'worker' },
  })

  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Update profile phone
  if (phone) {
    await adminClient.from('profiles').update({ phone }).eq('id', newUser.user.id)
  }

  // Create worker record
  const { data: workerData, error: workerError } = await adminClient.from('workers').insert({
    profile_id: newUser.user.id,
    hourly_rate: hourly_rate || 0,
    overtime_rate: overtime_rate || 0,
    bank_account: bank_account || null,
    notes: notes || null,
  }).select().single()

  if (workerError) return NextResponse.json({ error: workerError.message }, { status: 400 })

  return NextResponse.json({ workerId: workerData.id })
}
