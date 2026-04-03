'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function isPhone(value: string) {
  return /^[\d\s\-\+\(\)]+$/.test(value.trim()) && value.trim().length >= 8
}

export async function loginAction(_prevState: { error: string }, formData: FormData) {
  const identifier = (formData.get('identifier') as string).trim()
  const password = formData.get('password') as string

  let email = identifier

  if (isPhone(identifier)) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const raw = identifier.replace(/[\s\-]/g, '')
    const candidates = Array.from(new Set([
      raw,
      raw.startsWith('0') ? raw : '0' + raw,
      raw.startsWith('+886') ? raw.replace('+886', '0') : raw,
    ]))

    let profileId: string | null = null
    for (const col of ['phone', 'mobile'] as const) {
      for (const c of candidates) {
        const { data } = await admin.from('profiles').select('id').eq(col, c).limit(1).single()
        if (data?.id) { profileId = data.id; break }
      }
      if (profileId) break
    }

    if (!profileId) return { error: '查無此手機號碼' }

    const { data: userResp, error: userErr } = await admin.auth.admin.getUserById(profileId)
    if (userErr || !userResp.user?.email) return { error: '帳號設定異常，請聯絡管理員' }
    email = userResp.user.email
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: '帳號或密碼錯誤' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profile?.role === 'worker') {
    redirect('/worker/work-log')
  } else {
    redirect('/dashboard')
  }
}
