'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ManagerNewCustomerPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('請輸入客戶名稱'); return }
    setLoading(true)
    const { error } = await supabase.from('customers').insert({
      name: form.name.trim(),
      contact_person: form.contact_person || null,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
    })
    if (error) { toast.error('新增失敗：' + error.message); setLoading(false); return }
    toast.success('客戶已新增')
    router.push('/worker/manager')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/worker/manager" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">新增客戶</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">客戶名稱 *</label>
          <Input name="name" value={form.name} onChange={handleChange} placeholder="公司或個人名稱" required className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">聯絡人</label>
          <Input name="contact_person" value={form.contact_person} onChange={handleChange} placeholder="聯絡人姓名" className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">電話</label>
          <Input name="phone" value={form.phone} onChange={handleChange} placeholder="聯絡電話" type="tel" className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">地址</label>
          <Input name="address" value={form.address} onChange={handleChange} placeholder="地址" className="h-12 text-base" />
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full h-12 text-base">
            {loading ? '新增中...' : '新增客戶'}
          </Button>
        </div>
      </form>
    </div>
  )
}
