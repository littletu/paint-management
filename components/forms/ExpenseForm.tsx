'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { todayString } from '@/lib/utils/date'
import { Plus } from 'lucide-react'

interface Props {
  projects: Array<{ id: string; name: string }>
}

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
            <Select value={form.project_id} onValueChange={v => setForm(p => ({ ...p, project_id: v ?? '' }))}>
              <SelectTrigger><SelectValue placeholder="選擇工程" /></SelectTrigger>
              <SelectContent>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>類別</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">材料</SelectItem>
                  <SelectItem value="tool">工具</SelectItem>
                  <SelectItem value="transportation">交通</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
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
