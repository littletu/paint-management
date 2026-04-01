'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { todayString } from '@/lib/utils/date'
import { Plus } from 'lucide-react'

interface Props {
  projects: Array<{ id: string; name: string }>
}

const selectCls = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function ExpenseForm({ projects }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    project_id: '',
    date: todayString(),
    category: 'material' as const,
    amount: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.project_id) { toast.error('請選擇工程'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('請輸入金額'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('expenses').insert({
      ...form,
      amount: parseFloat(form.amount),
      created_by: user!.id,
    })
    if (error) { toast.error('新增失敗：' + error.message); setLoading(false); return }
    toast.success('開銷已記錄')
    setForm({ project_id: '', date: todayString(), category: 'material', amount: '', description: '' })
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增開銷
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>工程</Label>
            <select name="project_id" value={form.project_id} onChange={handleChange} className={selectCls}>
              <option value="">選擇工程</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>類別</Label>
              <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                <option value="material">材料</option>
                <option value="tool">工具</option>
                <option value="transportation">交通</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>金額（NT$）</Label>
            <Input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" min="0" step="1" />
          </div>
          <div className="space-y-1.5">
            <Label>說明</Label>
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="開銷說明" rows={2} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '新增中...' : '新增開銷'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
