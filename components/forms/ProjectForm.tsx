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
import type { Project, Customer } from '@/types'
import { Trash2 } from 'lucide-react'

interface Props {
  project?: Project
  customers: Customer[]
  onSaved?: () => void
}

const selectCls = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function ProjectForm({ project, customers, onSaved }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!project

  const [form, setForm] = useState({
    customer_id: project?.customer_id ?? '',
    name: project?.name ?? '',
    address: project?.address ?? '',
    status: project?.status ?? 'pending',
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
    contract_amount: project?.contract_amount?.toString() ?? '',
    description: project?.description ?? '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('請輸入工程名稱'); return }
    if (!form.customer_id) { toast.error('請選擇客戶'); return }

    setLoading(true)
    const payload = {
      ...form,
      contract_amount: form.contract_amount ? parseFloat(form.contract_amount) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    }

    if (isEdit) {
      const { error } = await supabase.from('projects').update(payload).eq('id', project.id)
      if (error) { toast.error('更新失敗：' + error.message); setLoading(false); return }
      toast.success('工程資料已更新')
      router.refresh()
      onSaved?.()
    } else {
      const { data, error } = await supabase.from('projects').insert(payload).select().single()
      if (error) { toast.error('新增失敗：' + error.message); setLoading(false); return }
      toast.success('工程已新增')
      router.push(`/projects/${data.id}`)
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!project || !confirm(`確定要刪除工程「${project.name}」嗎？`)) return
    const { error } = await supabase.from('projects').delete().eq('id', project.id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('工程已刪除')
    router.push('/projects')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{isEdit ? '編輯工程資料' : '工程基本資料'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="customer_id">客戶 *</Label>
              <select name="customer_id" value={form.customer_id} onChange={handleChange} className={selectCls}>
                <option value="">選擇客戶</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">工程名稱 *</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="工程名稱" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">狀態</Label>
              <select name="status" value={form.status} onChange={handleChange} className={selectCls}>
                <option value="pending">待開工</option>
                <option value="active">進行中</option>
                <option value="completed">已完工</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contract_amount">合約金額（NT$）</Label>
              <Input id="contract_amount" name="contract_amount" type="number" value={form.contract_amount} onChange={handleChange} placeholder="0" min="0" step="1" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="start_date">開始日期</Label>
              <Input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end_date">結束日期</Label>
              <Input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">施工地址</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="施工地址" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">工程說明</Label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} placeholder="工程說明、注意事項等" rows={3} />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? '儲存中...' : isEdit ? '儲存變更' : '新增工程'}
            </Button>
            {isEdit && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                刪除工程
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
