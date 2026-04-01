'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Worker, Profile } from '@/types'

interface Props {
  worker?: Worker & { profile?: Profile }
}

export function WorkerForm({ worker }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!worker

  const [form, setForm] = useState({
    // Profile fields (only for new worker)
    full_name: worker?.profile?.full_name ?? '',
    phone: worker?.profile?.phone ?? '',
    email: '',
    password: '',
    // Worker fields
    hourly_rate: worker?.hourly_rate?.toString() ?? '',
    overtime_rate: worker?.overtime_rate?.toString() ?? '',
    bank_account: worker?.bank_account ?? '',
    notes: worker?.notes ?? '',
    is_active: worker?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isEdit && (!form.email || !form.password || !form.full_name)) {
      toast.error('請填寫姓名、電子郵件與密碼'); return
    }
    setLoading(true)

    if (isEdit && worker) {
      // Update worker rates + profile
      const [workerRes, profileRes] = await Promise.all([
        supabase.from('workers').update({
          hourly_rate: parseFloat(form.hourly_rate) || 0,
          overtime_rate: parseFloat(form.overtime_rate) || 0,
          bank_account: form.bank_account || null,
          notes: form.notes || null,
          is_active: form.is_active,
        }).eq('id', worker.id),
        supabase.from('profiles').update({
          full_name: form.full_name,
          phone: form.phone || null,
        }).eq('id', worker.profile_id),
      ])

      if (workerRes.error || profileRes.error) {
        toast.error('更新失敗')
        setLoading(false)
        return
      }
      toast.success('師傅資料已更新')
      router.refresh()
    } else {
      // Create new user via admin API route
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          email: form.email,
          password: form.password,
          hourly_rate: parseFloat(form.hourly_rate) || 0,
          overtime_rate: parseFloat(form.overtime_rate) || 0,
          bank_account: form.bank_account,
          notes: form.notes,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error || '新增失敗'); setLoading(false); return }
      toast.success('師傅帳號已建立')
      router.push(`/workers/${json.workerId}`)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{isEdit ? '編輯師傅資料' : '師傅基本資料'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">姓名 *</Label>
              <Input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} placeholder="師傅姓名" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">電話</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="聯絡電話" />
            </div>

            {!isEdit && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="email">電子郵件 *</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="登入帳號（電子郵件）" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">初始密碼 *</Label>
                  <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="至少 6 位字元" required minLength={6} />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="hourly_rate">時薪（NT$）*</Label>
              <Input id="hourly_rate" name="hourly_rate" type="number" value={form.hourly_rate} onChange={handleChange} placeholder="例：200" min="0" step="1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="overtime_rate">加班時薪（NT$）*</Label>
              <Input id="overtime_rate" name="overtime_rate" type="number" value={form.overtime_rate} onChange={handleChange} placeholder="例：300" min="0" step="1" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bank_account">銀行帳號</Label>
              <Input id="bank_account" name="bank_account" value={form.bank_account} onChange={handleChange} placeholder="銀行帳號（薪轉用）" />
            </div>

            {isEdit && (
              <div className="space-y-1.5">
                <Label>在職狀態</Label>
                <select
                  value={form.is_active ? 'true' : 'false'}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.value === 'true' }))}
                  className="w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="true">在職</option>
                  <option value="false">離職</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">備註</Label>
            <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="備註事項" rows={2} />
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? '處理中...' : isEdit ? '儲存變更' : '建立師傅帳號'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
