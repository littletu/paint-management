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
import type { Customer } from '@/types'
import { Trash2 } from 'lucide-react'

interface Props {
  customer?: Customer
}

export function CustomerForm({ customer }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!customer

  const [form, setForm] = useState({
    name: customer?.name ?? '',
    contact_person: customer?.contact_person ?? '',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
    notes: customer?.notes ?? '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('請輸入客戶名稱'); return }
    setLoading(true)

    if (isEdit) {
      const { error } = await supabase.from('customers').update(form).eq('id', customer.id)
      if (error) { toast.error('更新失敗：' + error.message); setLoading(false); return }
      toast.success('客戶資料已更新')
      router.refresh()
    } else {
      const { data, error } = await supabase.from('customers').insert(form).select().single()
      if (error) { toast.error('新增失敗：' + error.message); setLoading(false); return }
      toast.success('客戶已新增')
      router.push(`/customers/${data.id}`)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!customer || !confirm(`確定要刪除客戶「${customer.name}」嗎？`)) return
    const { error } = await supabase.from('customers').delete().eq('id', customer.id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('客戶已刪除')
    router.push('/customers')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{isEdit ? '編輯客戶資料' : '客戶基本資料'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">公司/客戶名稱 *</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="請輸入名稱" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">聯絡人</Label>
              <Input id="contact_person" name="contact_person" value={form.contact_person} onChange={handleChange} placeholder="負責人姓名" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">聯絡電話</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="電話號碼" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">地址</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="地址" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">備註</Label>
            <Textarea id="notes" name="notes" value={form.notes} onChange={handleChange} placeholder="備註事項" rows={3} />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增客戶'}
            </Button>
            {isEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                刪除客戶
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
