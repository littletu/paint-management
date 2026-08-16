'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ManagerNewWorkerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    daily_rate: '',
    overtime_rate: '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) {
      toast.error('請填寫姓名、電子郵件與密碼'); return
    }
    if (form.password.length < 6) {
      toast.error('密碼至少 6 個字元'); return
    }
    setLoading(true)
    const res = await fetch('/api/workers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        daily_rate: parseFloat(form.daily_rate) || 0,
        overtime_rate: parseFloat(form.overtime_rate) || 0,
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || '新增失敗'); setLoading(false); return }
    toast.success('員工帳號已建立')
    router.push('/worker/manager')
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/worker/manager" className="text-gray-400 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">新增員工</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名 *</label>
          <Input name="full_name" value={form.full_name} onChange={handleChange} placeholder="員工姓名" required className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">電話</label>
          <Input name="phone" value={form.phone} onChange={handleChange} placeholder="聯絡電話" type="tel" className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">電子郵件 *</label>
          <Input name="email" value={form.email} onChange={handleChange} placeholder="登入帳號（電子郵件）" type="email" required className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">初始密碼 *</label>
          <Input name="password" value={form.password} onChange={handleChange} placeholder="至少 6 個字元" type="password" required minLength={6} className="h-12 text-base" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">日薪（NT$）</label>
            <Input name="daily_rate" value={form.daily_rate} onChange={handleChange} placeholder="0" type="number" min="0" className="h-12 text-base" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">加班時薪（NT$）</label>
            <Input name="overtime_rate" value={form.overtime_rate} onChange={handleChange} placeholder="0" type="number" min="0" className="h-12 text-base" />
          </div>
        </div>
        <div className="pt-2">
          <Button type="submit" disabled={loading} className="w-full h-12 text-base">
            {loading ? '建立中...' : '建立員工帳號'}
          </Button>
        </div>
      </form>
    </div>
  )
}
