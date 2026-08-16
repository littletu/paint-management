'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface Worker { id: string; name: string }
interface Project { id: string; name: string }
interface Props { workers: Worker[]; projects: Project[] }

function n(v: string) { return parseFloat(v) || 0 }

const today = () => new Date().toISOString().slice(0, 10)

export function SingleTimeEntryForm({ workers, projects }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    work_date: today(),
    worker_id: '',
    project_id: '',
    regular_days: '1',
    overtime_hours: '',
    transportation_fee: '',
    meal_fee: '',
    advance_payment: '',
    subsidy: '',
    other_fee: '',
    work_progress: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.worker_id) { toast.error('請選擇師傅'); return }
    if (!form.work_date) { toast.error('請選擇日期'); return }
    if (n(form.regular_days) < 0) { toast.error('工數不可為負數'); return }

    setSaving(true)
    const { error } = await supabase.from('time_entries').insert({
      work_date: form.work_date,
      worker_id: form.worker_id,
      project_id: form.project_id || null,
      regular_days: n(form.regular_days),
      overtime_hours: n(form.overtime_hours),
      transportation_fee: n(form.transportation_fee),
      meal_fee: n(form.meal_fee),
      advance_payment: n(form.advance_payment),
      subsidy: n(form.subsidy),
      other_fee: n(form.other_fee),
      work_progress: form.work_progress.trim() || null,
    })
    setSaving(false)

    if (error) { toast.error('新增失敗：' + error.message); return }
    toast.success('已新增工時記錄')
    router.push('/time-reports')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="p-6 space-y-5">
          {/* Date + Worker */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="work_date">日期</Label>
              <Input
                id="work_date"
                name="work_date"
                type="date"
                value={form.work_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="worker_id">師傅</Label>
              <select
                id="worker_id"
                name="worker_id"
                value={form.worker_id}
                onChange={handleChange}
                required
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— 請選擇 —</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="project_id">工程（選填）</Label>
            <select
              id="project_id"
              name="project_id"
              value={form.project_id}
              onChange={handleChange}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— 未指定 —</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Days + Overtime */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="regular_days">工數（天）</Label>
              <Input
                id="regular_days"
                name="regular_days"
                type="number"
                step="0.5"
                min="0"
                max="2"
                value={form.regular_days}
                onChange={handleChange}
                className="text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="overtime_hours">加班（小時）</Label>
              <Input
                id="overtime_hours"
                name="overtime_hours"
                type="number"
                step="0.5"
                min="0"
                value={form.overtime_hours}
                onChange={handleChange}
                placeholder="0"
                className="text-right"
              />
            </div>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'transportation_fee', label: '交通費' },
              { name: 'meal_fee', label: '餐費' },
              { name: 'advance_payment', label: '代墊費' },
              { name: 'subsidy', label: '補貼' },
              { name: 'other_fee', label: '其他費用' },
            ].map(({ name, label }) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input
                  id={name}
                  name={name}
                  type="number"
                  min="0"
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder="0"
                  className="text-right"
                />
              </div>
            ))}
          </div>

          {/* Work progress */}
          <div className="space-y-1.5">
            <Label htmlFor="work_progress">施工概況（選填）</Label>
            <textarea
              id="work_progress"
              name="work_progress"
              value={form.work_progress}
              onChange={handleChange}
              rows={3}
              placeholder="（選填）"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? '儲存中...' : '新增工時'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              取消
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
