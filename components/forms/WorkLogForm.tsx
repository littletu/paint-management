'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils/date'
import { CheckCircle2, Plus, ChevronLeft, ChevronRight, Calendar, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
  regular_days: '',
  overtime_hours: '',
  transportation_fee: '',
  meal_fee: '',
  advance_payment: '',
  advance_notes: '',
  subsidy: '',
  other_fee: '',
  work_progress: '',
}

const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

export function WorkLogForm({ workerId, projects, todayEntries, today }: Props) {
  const [selectedDate, setSelectedDate] = useState(today)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today))
  const [dateEntries, setDateEntries] = useState<any[]>(todayEntries)
  const [weekEntryDates, setWeekEntryDates] = useState<Set<string>>(
    () => todayEntries.length > 0 ? new Set([today]) : new Set()
  )
  const calendarRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showFees, setShowFees] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function fetchWeekEntries(ws: string) {
    const weekEnd = (() => {
      const d = new Date(ws + 'T12:00:00')
      d.setDate(d.getDate() + 6)
      return d.toISOString().split('T')[0]
    })()
    const { data } = await supabase
      .from('time_entries')
      .select('work_date')
      .eq('worker_id', workerId)
      .gte('work_date', ws)
      .lte('work_date', weekEnd)
    setWeekEntryDates(new Set(data?.map((e: any) => e.work_date) ?? []))
  }

  useEffect(() => {
    fetchWeekEntries(weekStart)
  }, [weekStart])

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

  function startEdit(entry: any) {
    setEditingId(entry.id)
    setEditingProject({ id: entry.project_id, name: entry.project?.name ?? entry.project_id, address: null })
    const hasFees = !!(entry.transportation_fee || entry.meal_fee || entry.advance_payment || entry.subsidy || entry.other_fee)
    setShowFees(hasFees)
    setForm({
      project_id: entry.project_id,
      regular_days: String(entry.regular_days || ''),
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
    setEditingProject(null)
    setShowFees(false)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.project_id) { toast.error('請選擇工程'); return }
    const regularDays = parseFloat(form.regular_days) || 0
    if (regularDays <= 0 && !editingId) { toast.error('請輸入工數'); return }

    setLoading(true)
    const payload = {
      worker_id: workerId,
      project_id: form.project_id,
      work_date: selectedDate,
      regular_days: parseFloat(form.regular_days) || 0,
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
      // Optimistic update: patch the local entry immediately
      const projectName = projects.find(p => p.id === form.project_id)?.name
        ?? editingProject?.name ?? ''
      setDateEntries(prev => prev.map(e =>
        e.id === editingId
          ? { ...e, ...payload, project: { name: projectName } }
          : e
      ))
    } else {
      const { data: inserted, error } = await supabase
        .from('time_entries')
        .insert(payload)
        .select('*, project:projects(name)')
        .single()
      if (error) {
        if (error.code === '23505') { toast.error('此工程今日已有記錄，請點擊下方記錄進行編輯') }
        else { toast.error('送出失敗：' + error.message) }
        setLoading(false)
        return
      }
      toast.success('工時已送出')
      // Optimistic update: add new entry to local state immediately
      if (inserted) {
        setDateEntries(prev => [...prev, inserted])
        setWeekEntryDates(prev => new Set([...prev, selectedDate]))
      }
    }

    setForm(emptyForm)
    setEditingId(null)
    setEditingProject(null)
    setShowFees(false)
    setLoading(false)
    // Refresh server state in background (no await — don't block UI)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Week Date Picker */}
      {(() => {
        const weekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(weekStart + 'T12:00:00')
          d.setDate(d.getDate() + i)
          return d.toISOString().split('T')[0]
        })
        // Allow up to end of current week (Sunday)
        const thisSunday = (() => {
          const d = new Date(today + 'T12:00:00')
          const daysUntilSunday = d.getDay() === 0 ? 0 : 7 - d.getDay()
          d.setDate(d.getDate() + daysUntilSunday)
          return d.toISOString().split('T')[0]
        })()
        const canGoNext = (() => {
          const d = new Date(weekStart + 'T12:00:00')
          d.setDate(d.getDate() + 7)
          return d.toISOString().split('T')[0] <= thisSunday
        })()
        const weekLabel = `${weekDays[0].slice(5).replace('-', '/')} ~ ${weekDays[6].slice(5).replace('-', '/')}`
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center justify-between mb-2.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(weekStart + 'T12:00:00')
                  d.setDate(d.getDate() - 7)
                  setWeekStart(d.toISOString().split('T')[0])
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs text-gray-500 font-medium">{weekLabel}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 relative"
                  onClick={() => calendarRef.current?.showPicker?.()}
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <input
                    ref={calendarRef}
                    type="date"
                    max={today}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    onChange={e => {
                      if (!e.target.value) return
                      setSelectedDate(e.target.value)
                      setWeekStart(getWeekStart(e.target.value))
                      setEditingId(null)
                      setForm(emptyForm)
                    }}
                  />
                </button>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => {
                    const d = new Date(weekStart + 'T12:00:00')
                    d.setDate(d.getDate() + 7)
                    setWeekStart(d.toISOString().split('T')[0])
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map(date => {
                const d = new Date(date + 'T12:00:00')
                const dow = d.getDay()
                const isSelected = date === selectedDate
                const isFuture = date > thisSunday
                const isToday = date === today
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={isFuture}
                    onClick={() => {
                      setSelectedDate(date)
                      setEditingId(null)
                      setForm(emptyForm)
                    }}
                    className={cn(
                      'flex flex-col items-center py-2 rounded-lg text-xs transition-colors',
                      isSelected
                        ? 'bg-orange-500 text-white'
                        : isToday
                        ? 'bg-orange-50 text-orange-600'
                        : isFuture
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <span className={cn(
                      'text-[10px] mb-0.5',
                      isSelected ? 'text-orange-100' : dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-400'
                    )}>
                      {DAY_LABELS[dow]}
                    </span>
                    <span className="font-semibold">{d.getDate()}</span>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full mt-0.5',
                      weekEntryDates.has(date)
                        ? isSelected ? 'bg-white/70' : 'bg-red-400'
                        : 'invisible'
                    )} />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Entries for selected date */}
      {dateEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {formatDate(selectedDate)} 已填記錄
          </p>
          {dateEntries.map((entry: any) => (
            <div
              key={entry.id}
              className="w-full text-left p-3 bg-green-50 rounded-lg border border-green-100"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{entry.project?.name ?? '工程'}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    工作 {entry.regular_days}天 ／ 加班 {entry.overtime_hours}h
                  </p>
                  {entry.work_progress && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">📝 {entry.work_progress}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(entry)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-300 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                    編輯
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('確定要刪除這筆工時記錄？')) return
                      const { error } = await supabase.from('time_entries').delete().eq('id', entry.id)
                      if (error) { toast.error('刪除失敗：' + error.message); return }
                      toast.success('已刪除')
                      // Optimistic update: remove from local state immediately
                      const remaining = dateEntries.filter(e => e.id !== entry.id)
                      setDateEntries(remaining)
                      if (remaining.length === 0) {
                        setWeekEntryDates(prev => {
                          const next = new Set(prev)
                          next.delete(selectedDate)
                          return next
                        })
                      }
                      router.refresh()
                    }}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    移除
                  </button>
                </div>
              </div>
            </div>
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
                <select
                  value={form.project_id}
                  onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))}
                  disabled={false}
                  className={cn(
                    'w-full h-12 rounded-lg border border-input bg-transparent px-3 text-base outline-none',
                    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    !form.project_id && 'text-muted-foreground'
                  )}
                >
                  <option value="">選取施工工程</option>
                  {editingProject && !projects.find(p => p.id === editingProject.id) && (
                    <option key={editingProject.id} value={editingProject.id}>
                      {editingProject.name}
                    </option>
                  )}
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Days & Overtime */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="regular_days">工數</Label>
                <Input
                  id="regular_days"
                  name="regular_days"
                  type="number"
                  value={form.regular_days}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                />
                <div className="flex gap-1.5">
                  {[{v: 1, label: '1工'}, {v: 0.5, label: '0.5工'}, {v: -0.5, label: '-0.5'}, {v: -1, label: '-1'}].map(({v, label}) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, regular_days: String(Math.max(0, (parseFloat(p.regular_days) || 0) + v)) }))}
                      className={`flex-1 text-xl py-4 rounded-xl font-bold transition-colors ${v > 0 ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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
                <div className="flex gap-1.5">
                  {[{v: 1, label: '+1'}, {v: -1, label: '-1'}, {v: 0.5, label: '+0.5'}, {v: -0.5, label: '-0.5'}].map(({v, label}) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, overtime_hours: String(Math.max(0, (parseFloat(p.overtime_hours) || 0) + v)) }))}
                      className={`flex-1 text-xl py-4 rounded-xl font-bold transition-colors ${v > 0 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fees toggle */}
            <button
              type="button"
              onClick={() => setShowFees(v => !v)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-colors"
            >
              <span className="font-medium">輸入費用</span>
              {showFees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFees && (
              <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
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
              </div>
            )}

            {/* Work progress */}
            <div className="space-y-1.5">
              <Label htmlFor="work_progress">施工概況</Label>
              <Textarea
                id="work_progress"
                name="work_progress"
                value={form.work_progress}
                onChange={handleChange}
                placeholder="今日施工進度、現場狀況、注意事項、費用說明..."
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
