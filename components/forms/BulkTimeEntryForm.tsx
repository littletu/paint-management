'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Worker { id: string; name: string; workerId: string }
interface Project { id: string; name: string }

interface Props {
  workers: Worker[]
  projects: Project[]
}

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function getDayOfWeek(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').getDay()
}

function isWeekend(dateStr: string) {
  const d = getDayOfWeek(dateStr)
  return d === 0 || d === 6
}

interface DayRow {
  date: string
  regular_days: string
  overtime_hours: string
  transportation_fee: string
  meal_fee: string
  advance_payment: string
  other_fee: string
  work_progress: string
  enabled: boolean
}

function makeDays(start: string): DayRow[] {
  return Array.from({ length: 14 }, (_, i) => {
    const date = addDays(start, i)
    const weekend = isWeekend(date)
    return {
      date,
      regular_days: weekend ? '0' : '1',
      overtime_hours: '0',
      transportation_fee: '',
      meal_fee: '',
      advance_payment: '',
      other_fee: '',
      work_progress: '',
      enabled: !weekend,
    }
  })
}

const selectCls = 'h-9 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus:border-orange-400 w-full'
const numCls = 'h-8 text-sm text-center px-1 w-full'

export function BulkTimeEntryForm({ workers, projects }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // Get Monday of current week as default period start
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
  const defaultStart = monday.toISOString().split('T')[0]

  const [workerId, setWorkerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [days, setDays] = useState<DayRow[]>(() => makeDays(defaultStart))
  const [saving, setSaving] = useState(false)

  const periodEnd = addDays(periodStart, 13)

  useEffect(() => {
    setDays(makeDays(periodStart))
  }, [periodStart])

  function updateDay(i: number, field: keyof DayRow, value: string | boolean) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  function setAllWeekdays(val: string) {
    setDays(prev => prev.map(d => isWeekend(d.date) ? d : { ...d, regular_days: val, enabled: parseFloat(val) > 0 }))
  }

  async function handleSubmit() {
    if (!workerId) { toast.error('請選擇師傅'); return }
    if (!projectId) { toast.error('請選擇工程'); return }

    const activeDays = days.filter(d => d.enabled && parseFloat(d.regular_days) > 0)
    if (activeDays.length === 0) { toast.error('至少需要一天有效工時'); return }

    setSaving(true)

    const payload = activeDays.map(d => ({
      worker_id: workerId,
      project_id: projectId,
      work_date: d.date,
      regular_days: parseFloat(d.regular_days) || 0,
      overtime_hours: parseFloat(d.overtime_hours) || 0,
      transportation_fee: parseFloat(d.transportation_fee) || 0,
      meal_fee: parseFloat(d.meal_fee) || 0,
      advance_payment: parseFloat(d.advance_payment) || 0,
      other_fee: parseFloat(d.other_fee) || 0,
      subsidy: 0,
      work_progress: d.work_progress.trim() || null,
    }))

    const { error } = await supabase.from('time_entries').upsert(payload, {
      onConflict: 'worker_id,project_id,work_date',
      ignoreDuplicates: false,
    })

    if (error) {
      toast.error('新增失敗：' + error.message)
      setSaving(false)
      return
    }

    toast.success(`成功新增 ${activeDays.length} 筆工時記錄`)
    setSaving(false)
    router.push('/time-reports')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>師傅 *</Label>
              <select value={workerId} onChange={e => setWorkerId(e.target.value)} className={selectCls}>
                <option value="">選擇師傅</option>
                {workers.map(w => <option key={w.workerId} value={w.workerId}>{w.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>工程 *</Label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={selectCls}>
                <option value="">選擇工程</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>期間開始日期 *</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={e => setPeriodStart(e.target.value)}
                className="h-9 text-sm"
              />
              <p className="text-xs text-gray-400">結束：{periodEnd}（共 14 天）</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">每日工時明細</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">快速設定工作日：</span>
              {['1', '0.5', '0'].map(v => (
                <button
                  key={v}
                  onClick={() => setAllWeekdays(v)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 transition-colors"
                >
                  {v === '0' ? '全清' : `${v}天`}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600 w-28">日期</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-12">啟用</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-20">工數</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-16">加班(h)</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-20">交通費</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-20">餐費</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-20">代墊費</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-20">其他</th>
                  <th className="text-left px-2 py-2.5 font-medium text-gray-600">施工概況</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {days.map((day, i) => {
                  const dow = getDayOfWeek(day.date)
                  const weekend = isWeekend(day.date)
                  return (
                    <tr key={day.date} className={weekend ? 'bg-gray-50/60' : day.enabled ? '' : 'opacity-50'}>
                      <td className="px-3 py-2">
                        <span className="font-medium text-gray-800">{day.date.slice(5)}</span>
                        <span className={`ml-1.5 text-xs ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                          ({DAY_NAMES[dow]})
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={day.enabled}
                          onChange={e => updateDay(i, 'enabled', e.target.checked)}
                          className="w-4 h-4 accent-orange-500"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-0.5">
                          {['0', '0.5', '1'].map(v => (
                            <button
                              key={v}
                              onClick={() => {
                                updateDay(i, 'regular_days', v)
                                updateDay(i, 'enabled', parseFloat(v) > 0)
                              }}
                              className={`flex-1 text-xs py-1 rounded transition-colors ${
                                day.regular_days === v
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.overtime_hours} onChange={e => updateDay(i, 'overtime_hours', e.target.value)}
                          type="number" min="0" step="0.5" className={numCls} placeholder="0" disabled={!day.enabled} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.transportation_fee} onChange={e => updateDay(i, 'transportation_fee', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" disabled={!day.enabled} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.meal_fee} onChange={e => updateDay(i, 'meal_fee', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" disabled={!day.enabled} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.advance_payment} onChange={e => updateDay(i, 'advance_payment', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" disabled={!day.enabled} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.other_fee} onChange={e => updateDay(i, 'other_fee', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" disabled={!day.enabled} />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.work_progress} onChange={e => updateDay(i, 'work_progress', e.target.value)}
                          className="h-8 text-sm px-2" placeholder="（選填）" disabled={!day.enabled} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              共 <span className="font-semibold text-orange-600">{days.filter(d => d.enabled).length}</span> 天工作日・
              合計工數 <span className="font-semibold">{days.filter(d => d.enabled).reduce((s, d) => s + (parseFloat(d.regular_days) || 0), 0)}</span> 天
            </div>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? '新增中...' : '確認新增'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
