'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const selectCls = 'w-full h-12 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

interface Props {
  customers: { id: string; name: string }[]
  paymentStatuses: { id: string; label: string }[]
}

export function ManagerNewProjectForm({ customers, paymentStatuses }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    customer_id: '',
    name: '',
    address: '',
    status: 'pending',
    payment_status: paymentStatuses[0]?.label ?? '待送單',
    start_date: '',
    contract_amount: '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('請輸入工程名稱'); return }
    if (!form.customer_id) { toast.error('請選擇客戶'); return }
    setLoading(true)
    const { error } = await supabase.from('projects').insert({
      name: form.name.trim(),
      customer_id: form.customer_id,
      address: form.address || null,
      status: form.status,
      payment_status: form.payment_status,
      start_date: form.start_date || null,
      contract_amount: form.contract_amount ? parseFloat(form.contract_amount) : null,
    })
    if (error) { toast.error('新增失敗：' + error.message); setLoading(false); return }
    toast.success('專案已新增')
    router.push('/worker/manager')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">客戶 *</label>
        <select name="customer_id" value={form.customer_id} onChange={handleChange} className={selectCls}>
          <option value="">選擇客戶</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">工程名稱 *</label>
        <Input name="name" value={form.name} onChange={handleChange} placeholder="工程名稱" required className="h-12 text-base" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">施工地址</label>
        <Input name="address" value={form.address} onChange={handleChange} placeholder="施工地址" className="h-12 text-base" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">工程狀態</label>
          <select name="status" value={form.status} onChange={handleChange} className={selectCls}>
            <option value="pending">待開工</option>
            <option value="active">進行中</option>
            <option value="completed">已完工</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">款項狀態</label>
          <select name="payment_status" value={form.payment_status} onChange={handleChange} className={selectCls}>
            {paymentStatuses.map(ps => <option key={ps.id} value={ps.label}>{ps.label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">開始日期</label>
          <Input name="start_date" type="date" value={form.start_date} onChange={handleChange} className="h-12 text-base" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">合約金額</label>
          <Input name="contract_amount" type="number" value={form.contract_amount} onChange={handleChange} placeholder="0" min="0" className="h-12 text-base" />
        </div>
      </div>
      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full h-12 text-base">
          {loading ? '新增中...' : '新增專案'}
        </Button>
      </div>
    </form>
  )
}
