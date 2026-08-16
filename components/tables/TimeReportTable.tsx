'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'

interface TimeEntry {
  id: string
  work_date: string
  worker_id: string
  project_id: string | null
  regular_days: number
  overtime_hours: number
  transportation_fee: number
  meal_fee: number
  advance_payment: number
  subsidy: number
  other_fee: number
  work_progress: string | null
  worker: { profile: { full_name: string } | null } | null
  project: { name: string } | null
}

interface Project { id: string; name: string }

interface Props {
  entries: TimeEntry[]
  projects: Project[]
}

function n(v: string) { return parseFloat(v) || 0 }

export function TimeReportTable({ entries, projects }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function openEdit(entry: TimeEntry) {
    setEditEntry(entry)
    setForm({
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
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!editEntry) return
    if (n(form.regular_days) < 0) { toast.error('請輸入正確工數'); return }
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
    }).eq('id', editEntry.id)
    setSaving(false)
    if (error) { toast.error('更新失敗：' + error.message); return }
    toast.success('已更新')
    setEditEntry(null)
    router.refresh()
  }

  async function handleDelete(entry: TimeEntry) {
    if (!confirm(`確定要刪除 ${formatDate(entry.work_date)} ${entry.worker?.profile?.full_name ?? ''} 的工時記錄？`)) return
    const { error } = await supabase.from('time_entries').delete().eq('id', entry.id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('已刪除')
    router.refresh()
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">日期</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">師傅</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">工程</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">天數</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">加班</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">交通</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">餐費</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">代墊</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">補貼</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">其他</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">施工概況</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.work_date)}</td>
                <td className="px-4 py-3">
                  <Link href={`/workers/${entry.worker_id}`} className="text-blue-600 hover:underline">
                    {entry.worker?.profile?.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {entry.project_id ? (
                    <Link href={`/projects/${entry.project_id}`} className="text-blue-600 hover:underline">
                      {entry.project?.name}
                    </Link>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right">{entry.regular_days}天</td>
                <td className="px-4 py-3 text-right text-orange-600">
                  {entry.overtime_hours > 0 ? `${entry.overtime_hours}h` : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {entry.transportation_fee > 0 ? formatCurrency(entry.transportation_fee) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {entry.meal_fee > 0 ? formatCurrency(entry.meal_fee) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {entry.advance_payment > 0 ? formatCurrency(entry.advance_payment) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {entry.subsidy > 0 ? formatCurrency(entry.subsidy) : '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  {entry.other_fee > 0 ? formatCurrency(entry.other_fee) : '—'}
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <span className="text-gray-500 text-xs line-clamp-2">{entry.work_progress || '—'}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(entry)}
                      className="p-1.5 rounded text-orange-500 hover:bg-orange-50 transition-colors"
                      title="編輯"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry)}
                      className="p-1.5 rounded text-red-400 hover:bg-red-50 transition-colors"
                      title="刪除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!entries.length && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-400">
                  無符合條件的工時記錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editEntry} onOpenChange={(open, _e) => { if (!open) setEditEntry(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              編輯工時記錄
              {editEntry && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {formatDate(editEntry.work_date)}・{editEntry.worker?.profile?.full_name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {editEntry && (
            <div className="space-y-4 pt-1">
              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">工程</label>
                <select
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">工數（天）</label>
                  <Input
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">加班（小時）</label>
                  <Input
                    name="overtime_hours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={form.overtime_hours}
                    onChange={handleChange}
                    className="text-right"
                  />
                </div>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'transportation_fee', label: '交通費' },
                  { name: 'meal_fee', label: '餐費' },
                  { name: 'advance_payment', label: '代墊費' },
                  { name: 'subsidy', label: '補貼' },
                  { name: 'other_fee', label: '其他費用' },
                ].map(({ name, label }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <Input
                      name={name}
                      type="number"
                      min="0"
                      value={form[name]}
                      onChange={handleChange}
                      placeholder="0"
                      className="text-right"
                    />
                  </div>
                ))}
              </div>

              {/* Work progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">施工概況</label>
                <textarea
                  name="work_progress"
                  value={form.work_progress}
                  onChange={handleChange}
                  rows={3}
                  placeholder="（選填）"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? '儲存中...' : '儲存'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditEntry(null)}
                  disabled={saving}
                >
                  取消
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
