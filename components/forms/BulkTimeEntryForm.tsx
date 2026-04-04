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
interface Props { workers: Worker[]; projects: Project[] }

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

function getDayOfWeek(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').getDay()
}

function isWeekend(dateStr: string) {
  const d = getDayOfWeek(dateStr)
  return d === 0 || d === 6
}

// Generate dates for first half (1-15) or second half (16-end) of a month
function makePeriodDates(year: number, month: number, half: 1 | 2): string[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()
  const start = half === 1 ? 1 : 16
  const end = half === 1 ? 15 : lastDay
  return Array.from({ length: end - start + 1 }, (_, i) => {
    return `${year}-${pad(month)}-${pad(start + i)}`
  })
}

interface DayRow {
  date: string
  project_id: string
  regular_days: string
  overtime_hours: string
  transportation_fee: string
  meal_fee: string
  advance_payment: string
  other_fee: string
  work_progress: string
}

function makeDays(dates: string[], defaultProjectId: string): DayRow[] {
  return dates.map(date => ({
    date,
    project_id: defaultProjectId,
    regular_days: isWeekend(date) ? '0' : '1',
    overtime_hours: '',
    transportation_fee: '',
    meal_fee: '',
    advance_payment: '',
    other_fee: '',
    work_progress: '',
  }))
}

const selectCls = 'h-9 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus:border-orange-400 w-full'
const smallSelectCls = 'h-8 rounded-lg border border-input bg-white px-2 text-xs outline-none focus:border-orange-400 w-full'
const numCls = 'h-8 text-sm text-center px-1 w-full'

export function BulkTimeEntryForm({ workers, projects }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const now = new Date()
  const curYear = now.getFullYear()
  const curMonth = now.getMonth() + 1
  const curHalf: 1 | 2 = now.getDate() <= 15 ? 1 : 2

  const [workerId, setWorkerId] = useState('')
  const [defaultProjectId, setDefaultProjectId] = useState('')
  const [year, setYear] = useState(curYear)
  const [month, setMonth] = useState(curMonth)
  const [half, setHalf] = useState<1 | 2>(curHalf)
  const [days, setDays] = useState<DayRow[]>(() => makeDays(makePeriodDates(curYear, curMonth, curHalf), ''))
  const [saving, setSaving] = useState(false)

  // Rebuild days when period changes
  useEffect(() => {
    const dates = makePeriodDates(year, month, half)
    setDays(prev => {
      // Preserve existing values if date matches, else create fresh
      const prevMap = new Map(prev.map(d => [d.date, d]))
      return dates.map(date => prevMap.get(date) ?? {
        date,
        project_id: defaultProjectId,
        regular_days: isWeekend(date) ? '0' : '1',
        overtime_hours: '',
        transportation_fee: '',
        meal_fee: '',
        advance_payment: '',
        other_fee: '',
        work_progress: '',
      })
    })
  }, [year, month, half])

  // Apply default project to all rows when changed
  function applyDefaultProject(pid: string) {
    setDefaultProjectId(pid)
    setDays(prev => prev.map(d => ({ ...d, project_id: pid })))
  }

  function updateDay(i: number, field: keyof DayRow, value: string) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  function setAllRegularDays(val: string) {
    setDays(prev => prev.map(d => ({ ...d, regular_days: val })))
  }

  const periodDates = makePeriodDates(year, month, half)
  const periodLabel = `${year}年${month}月 ${half === 1 ? '上半（1～15日）' : `下半（16～${periodDates[periodDates.length - 1].slice(8)}日）`}`

  const years = Array.from({ length: 3 }, (_, i) => curYear - i + 1)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  const activeDays = days.filter(d => parseFloat(d.regular_days) > 0 && d.project_id)
  const totalDays = days.reduce((s, d) => s + (parseFloat(d.regular_days) || 0), 0)

  async function handleSubmit() {
    if (!workerId) { toast.error('請選擇師傅'); return }
    const missingProject = days.find(d => parseFloat(d.regular_days) > 0 && !d.project_id)
    if (missingProject) { toast.error(`${missingProject.date} 有工數但未選擇工程`); return }
    if (activeDays.length === 0) { toast.error('至少需要一天有工數且已選擇工程'); return }

    setSaving(true)
    const payload = activeDays.map(d => ({
      worker_id: workerId,
      project_id: d.project_id,
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

    if (error) { toast.error('新增失敗：' + error.message); setSaving(false); return }
    toast.success(`成功新增 ${activeDays.length} 筆工時記錄`)
    setSaving(false)
    router.push('/time-reports')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本設定</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Worker */}
            <div className="space-y-1.5">
              <Label>師傅 *</Label>
              <select value={workerId} onChange={e => setWorkerId(e.target.value)} className={selectCls}>
                <option value="">選擇師傅</option>
                {workers.map(w => <option key={w.workerId} value={w.workerId}>{w.name}</option>)}
              </select>
            </div>

            {/* Default project */}
            <div className="space-y-1.5">
              <Label>預設工程（套用全部）</Label>
              <select value={defaultProjectId} onChange={e => applyDefaultProject(e.target.value)} className={selectCls}>
                <option value="">選擇預設工程</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* Year + Month */}
            <div className="space-y-1.5">
              <Label>年月</Label>
              <div className="flex gap-2">
                <select value={year} onChange={e => setYear(parseInt(e.target.value))} className={selectCls}>
                  {years.map(y => <option key={y} value={y}>{y} 年</option>)}
                </select>
                <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className={selectCls}>
                  {months.map(m => <option key={m} value={m}>{m} 月</option>)}
                </select>
              </div>
            </div>

            {/* Half */}
            <div className="space-y-1.5">
              <Label>期間</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setHalf(1)}
                  className={`flex-1 h-9 text-sm rounded-lg border transition-colors ${half === 1 ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}
                >
                  上半（1-15）
                </button>
                <button
                  onClick={() => setHalf(2)}
                  className={`flex-1 h-9 text-sm rounded-lg border transition-colors ${half === 2 ? 'bg-orange-500 text-white border-orange-500' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}
                >
                  下半（16-底）
                </button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">期間：{periodLabel}</p>
        </CardContent>
      </Card>

      {/* Day grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">每日工時明細</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">快速設定所有工數：</span>
              {['1', '0.5', '0'].map(v => (
                <button key={v} onClick={() => setAllRegularDays(v)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 transition-colors">
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
                  <th className="text-left px-3 py-2.5 font-medium text-gray-600 whitespace-nowrap">日期</th>
                  <th className="text-left px-2 py-2.5 font-medium text-gray-600 min-w-[140px]">工程</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-24">工數</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-16">加班(h)</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-18">交通費</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-18">餐費</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-18">代墊費</th>
                  <th className="text-center px-2 py-2.5 font-medium text-gray-600 w-18">其他</th>
                  <th className="text-left px-2 py-2.5 font-medium text-gray-600">施工概況</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {days.map((day, i) => {
                  const dow = getDayOfWeek(day.date)
                  const weekend = isWeekend(day.date)
                  const hasWork = parseFloat(day.regular_days) > 0
                  return (
                    <tr key={day.date} className={weekend ? 'bg-gray-50/70' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-medium text-gray-800">{day.date.slice(5)}</span>
                        <span className={`ml-1.5 text-xs ${dow === 0 ? 'text-red-400' : dow === 6 ? 'text-blue-400' : 'text-gray-400'}`}>
                          ({DAY_NAMES[dow]})
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <select
                          value={day.project_id}
                          onChange={e => updateDay(i, 'project_id', e.target.value)}
                          className={smallSelectCls}
                        >
                          <option value="">— 無 —</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-0.5">
                          {['0', '0.5', '1'].map(v => (
                            <button key={v}
                              onClick={() => updateDay(i, 'regular_days', v)}
                              className={`flex-1 text-xs py-1 rounded transition-colors ${
                                day.regular_days === v ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-orange-100'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.overtime_hours} onChange={e => updateDay(i, 'overtime_hours', e.target.value)}
                          type="number" min="0" step="0.5" className={numCls} placeholder="0" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.transportation_fee} onChange={e => updateDay(i, 'transportation_fee', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.meal_fee} onChange={e => updateDay(i, 'meal_fee', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.advance_payment} onChange={e => updateDay(i, 'advance_payment', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.other_fee} onChange={e => updateDay(i, 'other_fee', e.target.value)}
                          type="number" min="0" className={numCls} placeholder="0" />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input value={day.work_progress} onChange={e => updateDay(i, 'work_progress', e.target.value)}
                          className="h-8 text-sm px-2" placeholder="（選填）" />
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
              合計工數 <span className="font-semibold text-orange-600">{totalDays}</span> 天・
              有效筆數 <span className="font-semibold">{activeDays.length}</span> 筆
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
