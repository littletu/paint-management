'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X } from 'lucide-react'

interface TimeEntry {
  id: string
  work_date: string
  project_id: string | null
  regular_days: number
  overtime_hours: number
  transportation_fee: number
  meal_fee: number
  advance_payment: number
  subsidy: number
  other_fee: number
  work_progress: string | null
  project: { name: string } | null
}

interface Project { id: string; name: string }

interface Props {
  entry: TimeEntry
  projects: Project[]
  canEdit: boolean
}

const inputCls = 'h-8 text-sm text-right px-2'
const labelCls = 'text-xs text-gray-500 pt-1.5'

export function TimeEntryEditRow({ entry, projects, canEdit }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    project_id: entry.project_id ?? '',
    regular_days: String(entry.regular_days),
    overtime_hours: String(entry.overtime_hours),
    transportation_fee: String(entry.transportation_fee || ''),
    meal_fee: String(entry.meal_fee || ''),
    advance_payment: String(entry.advance_payment || ''),
    subsidy: String(entry.subsidy || ''),
    other_fee: String(entry.other_fee || ''),
    work_progress: entry.work_progress ?? '',
  })

  function n(v: string) { return parseFloat(v) || 0 }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!form.regular_days || n(form.regular_days) < 0) { toast.error('請輸入正確工數'); return }
    setSaving(true)

    const { error } = await supabase.from('time_entries').update({
      project_id: form.project_id || null,
      regular_days: n(form.regular_days),
      overtime_hours: n(form.overtime_hours),
      transportation_fee: n(form.transportation_fee),
      meal_fee: n(form.meal_fee),
      advance_payment: n(form.advance_payment),
      subsidy: n(form.subsidy),
      other_fee: n(form.other_fee),
      work_progress: form.work_progress.trim() || null,
    }).eq('id', entry.id)

    if (error) { toast.error('更新失敗：' + error.message); setSaving(false); return }
    toast.success('已更新')
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這筆工時記錄？')) return
    const { error } = await supabase.from('time_entries').delete().eq('id', entry.id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('已刪除')
    router.refresh()
  }

  const fees = [
    { label: '交通費', value: entry.transportation_fee },
    { label: '餐費', value: entry.meal_fee },
    { label: '代墊費', value: entry.advance_payment },
    { label: '補貼', value: entry.subsidy },
    { label: '其他費用', value: entry.other_fee },
  ].filter(f => f.value > 0)

  if (editing) {
    return (
      <div className="rounded-lg border border-orange-200 bg-orange-50/40 px-3 py-3 text-xs space-y-2.5">
        {/* 日期（唯讀）+ 工程選擇 */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-gray-700">{formatDate(entry.work_date)}</span>
          <select
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            className="flex-1 h-8 rounded-lg border border-input bg-white px-2 text-xs outline-none max-w-[160px]"
          >
            <option value="">選擇工程</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* 工數 + 加班 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className={labelCls}>工數（天）</p>
            <Input name="regular_days" type="number" step="0.5" min="0" max="2"
              value={form.regular_days} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>加班（小時）</p>
            <Input name="overtime_hours" type="number" step="0.5" min="0"
              value={form.overtime_hours} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        {/* 費用 */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className={labelCls}>交通費</p>
            <Input name="transportation_fee" type="number" min="0"
              value={form.transportation_fee} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div>
            <p className={labelCls}>餐費</p>
            <Input name="meal_fee" type="number" min="0"
              value={form.meal_fee} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div>
            <p className={labelCls}>代墊費</p>
            <Input name="advance_payment" type="number" min="0"
              value={form.advance_payment} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div>
            <p className={labelCls}>補貼</p>
            <Input name="subsidy" type="number" min="0"
              value={form.subsidy} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
          <div>
            <p className={labelCls}>其他費用</p>
            <Input name="other_fee" type="number" min="0"
              value={form.other_fee} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
        </div>

        {/* 備註 */}
        <div>
          <p className={labelCls}>工作進度備註</p>
          <input
            name="work_progress"
            value={form.work_progress}
            onChange={handleChange}
            placeholder="（選填）"
            className="w-full h-8 rounded-lg border border-input bg-white px-2.5 text-xs outline-none"
          />
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1 flex-1 justify-center py-1.5 rounded-lg bg-orange-500 text-white font-medium transition-colors hover:bg-orange-600 disabled:opacity-60">
            <Check className="w-3.5 h-3.5" />
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button onClick={() => setEditing(false)} disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2.5 text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-gray-800">{formatDate(entry.work_date)}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 truncate max-w-[90px] text-right">{entry.project?.name ?? '—'}</span>
          {canEdit && (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-md text-orange-500 bg-orange-50 active:bg-orange-100 transition-colors"
                aria-label="編輯"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-md text-red-400 bg-red-50 active:bg-red-100 transition-colors"
                aria-label="刪除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-4 text-gray-600">
        <span>工數 <span className="font-medium text-gray-800">{entry.regular_days}天</span></span>
        {entry.overtime_hours > 0 && (
          <span>加班 <span className="font-medium text-gray-800">{entry.overtime_hours}h</span></span>
        )}
      </div>
      {fees.length > 0 && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-200 flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
          {fees.map(f => (
            <span key={f.label}>{f.label} <span className="font-medium text-gray-800">{formatCurrency(f.value)}</span></span>
          ))}
        </div>
      )}
      {entry.work_progress && (
        <p className="mt-1.5 pt-1.5 border-t border-gray-200 text-gray-500">{entry.work_progress}</p>
      )}
    </div>
  )
}
