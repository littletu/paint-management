'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils/date'
import { CheckCircle2, Plus } from 'lucide-react'
import type { TimeEntry } from '@/types'

interface Project {
  id: string
  name: string
  address: string | null
}

interface Props {
  workerId: string
  projects: Project[]
  todayEntries: TimeEntry[]
  today: string
}

const emptyForm = {
  project_id: '',
  regular_hours: '',
  overtime_hours: '',
  transportation_fee: '',
  meal_fee: '',
  advance_payment: '',
  advance_notes: '',
  subsidy: '',
  other_fee: '',
  work_progress: '',
}

export function WorkLogForm({ workerId, projects, todayEntries, today }: Props) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [dateEntries, setDateEntries] = useState<any[]>(todayEntries)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (selectedDate === today) {
      setDateEntries(todayEntries)
      return
    }
    supabase
      .from('time_entries')
      .select('*, project:projects(name)')
      .eq('worker_id', workerId)
      .eq('work_date', selectedDate)
      .then(({ data }) => setDateEntries(data ?? []))
  }, [selectedDate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function startEdit(entry: TimeEntry) {
    setEditingId(entry.id)
    setForm({
      project_id: entry.project_id,
      regular_hours: String(entry.regular_hours || ''),
      overtime_hours: String(entry.overtime_hours || ''),
      transportation_fee: String(entry.transportation_fee || ''),
      meal_fee: String(entry.meal_fee || ''),
      advance_payment: String(entry.advance_payment || ''),
      advance_notes: '',
      subsidy: String(entry.subsidy || ''),
      other_fee: String(entry.other_fee || ''),
      work_progress: entry.work_progress || '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.project_id) { toast.error('請選擇工程'); return }
    const regularHours = parseFloat(form.regular_hours) || 0
    if (regularHours <= 0 && !editingId) { toast.error('請輸入工作時間'); return }

    setLoading(true)
    const payload = {
      worker_id: workerId,
      project_id: form.project_id,
      work_date: selectedDate,
      regular_hours: parseFloat(form.regular_hours) || 0,
      overtime_hours: parseFloat(form.overtime_hours) || 0,
      transportation_fee: parseFloat(form.transportation_fee) || 0,
      meal_fee: parseFloat(form.meal_fee) || 0,
      advance_payment: parseFloat(form.advance_payment) || 0,
      subsidy: parseFloat(form.subsidy) || 0,
      other_fee: parseFloat(form.other_fee) || 0,
      work_progress: form.work_progress || null,
    }

    if (editingId) {
      const { error } = await supabase.from('time_entries').update(payload).eq('id', editingId)
      if (error) { toast.error('更新失敗：' + error.message); setLoading(false); return }
      toast.success('工時已更新')
    } else {
      const { error } = await supabase.from('time_entries').insert(payload)
      if (error) {
        if (error.code === '23505') { toast.error('此工程今日已有記錄，請點擊下方記錄進行編輯') }
        else { toast.error('送出失敗：' + error.message) }
        setLoading(false)
        return
      }
      toast.success('工時已送出')
    }

    setForm(emptyForm)
    setEditingId(null)
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Date picker */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3">
        <Label htmlFor="work_date" className="text-sm font-medium text-gray-700 whitespace-nowrap">選擇日期</Label>
        <Input
          id="work_date"
          type="date"
          value={selectedDate}
          max={today}
          onChange={e => {
            setSelectedDate(e.target.value)
            setEditingId(null)
            setForm(emptyForm)
          }}
          className="border-0 shadow-none p-0 h-auto text-sm"
        />
      </div>

      {/* Entries for selected date */}
      {dateEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {formatDate(selectedDate)} 已填記錄
          </p>
          {dateEntries.map((entry: any) => (
            <button
              key={entry.id}
              onClick={() => startEdit(entry)}
              className="w-full text-left p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="flex justify-between items-center">
                <p className="font-medium text-sm text-gray-900">{entry.project?.name ?? '工程'}</p>
                <Badge variant="secondary" className="text-xs">點擊編輯</Badge>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                正常 {entry.regular_hours}h ／ 加班 {entry.overtime_hours}h
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {editingId ? '編輯工時記錄' : (
              <span className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                {selectedDate === today ? '新增今日工時' : `新增 ${formatDate(selectedDate)} 工時`}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project select */}
            <div className="space-y-1.5">
              <Label>工程 *</Label>
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 rounded p-3">目前沒有指派工程，請聯絡管理者</p>
              ) : (
                <Select
                  value={form.project_id}
                  onValueChange={v => setForm(p => ({ ...p, project_id: v ?? '' }))}
                  disabled={!!editingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇今日施工工程" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id} label={p.name}>
                        {p.address ? `${p.name}（${p.address}）` : p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="regular_hours">工作時間（小時）</Label>
                <Input
                  id="regular_hours"
                  name="regular_hours"
                  type="number"
                  value={form.regular_hours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="overtime_hours">加班時數（小時）</Label>
                <Input
                  id="overtime_hours"
                  name="overtime_hours"
                  type="number"
                  value={form.overtime_hours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                />
              </div>
            </div>

            {/* Fees */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="transportation_fee">交通費（NT$）</Label>
                <Input
                  id="transportation_fee"
                  name="transportation_fee"
                  type="number"
                  value={form.transportation_fee}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="meal_fee">餐費（NT$）</Label>
                <Input
                  id="meal_fee"
                  name="meal_fee"
                  type="number"
                  value={form.meal_fee}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="advance_payment">代墊費（NT$）</Label>
                <Input
                  id="advance_payment"
                  name="advance_payment"
                  type="number"
                  value={form.advance_payment}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subsidy">補貼（NT$）</Label>
                <Input
                  id="subsidy"
                  name="subsidy"
                  type="number"
                  value={form.subsidy}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="other_fee">其他費用（NT$）</Label>
              <Input
                id="other_fee"
                name="other_fee"
                type="number"
                value={form.other_fee}
                onChange={handleChange}
                placeholder="0"
                min="0"
                step="1"
                inputMode="numeric"
              />
            </div>

            {/* Work progress */}
            <div className="space-y-1.5">
              <Label htmlFor="work_progress">施工概況</Label>
              <Textarea
                id="work_progress"
                name="work_progress"
                value={form.work_progress}
                onChange={handleChange}
                placeholder="今日施工進度、現場狀況、注意事項..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={loading || projects.length === 0} className="flex-1">
                {loading ? '送出中...' : editingId ? '更新記錄' : '送出工時'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  取消
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
