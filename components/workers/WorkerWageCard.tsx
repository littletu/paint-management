'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { TrendingUp, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react'

interface WageHistory {
  id: string
  daily_rate: number
  overtime_rate: number
  effective_date: string
  notes: string | null
  created_at: string
}

interface Props {
  workerId: string
  currentDailyRate: number
  currentOvertimeRate: number
  history: WageHistory[]
}

type EditForm = {
  daily_rate: string
  overtime_rate: string
  effective_date: string
  notes: string
}

function emptyForm(h?: WageHistory): EditForm {
  return {
    daily_rate: h ? String(h.daily_rate) : '',
    overtime_rate: h ? String(h.overtime_rate) : '',
    effective_date: h ? h.effective_date : new Date().toISOString().slice(0, 10),
    notes: h?.notes ?? '',
  }
}

export function WorkerWageCard({ workerId, currentDailyRate, currentOvertimeRate, history }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // new entry form
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditForm>({
    daily_rate: String(currentDailyRate),
    overtime_rate: String(currentOvertimeRate),
    effective_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  // edit existing entry
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(emptyForm())
  const [editSaving, setEditSaving] = useState(false)

  // delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showAllHistory, setShowAllHistory] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function startEdit(h: WageHistory) {
    setEditingId(h.id)
    setEditForm(emptyForm(h))
    setShowForm(false)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newDaily = parseFloat(form.daily_rate)
    const newOvertime = parseFloat(form.overtime_rate)
    if (!newDaily || newDaily <= 0) { toast.error('請輸入正確日薪'); return }
    if (!newOvertime || newOvertime <= 0) { toast.error('請輸入正確加班時薪'); return }
    if (!form.effective_date) { toast.error('請選擇生效日期'); return }

    setSaving(true)
    const [historyRes, workerRes] = await Promise.all([
      supabase.from('worker_wage_history').insert({
        worker_id: workerId,
        daily_rate: newDaily,
        overtime_rate: newOvertime,
        effective_date: form.effective_date,
        notes: form.notes.trim() || null,
      }),
      supabase.from('workers').update({
        daily_rate: newDaily,
        overtime_rate: newOvertime,
      }).eq('id', workerId),
    ])
    setSaving(false)

    if (historyRes.error || workerRes.error) {
      toast.error('調整失敗：' + (historyRes.error?.message ?? workerRes.error?.message))
      return
    }

    toast.success('薪資已調整')
    setShowForm(false)
    setForm(p => ({ ...p, notes: '' }))
    router.refresh()
  }

  async function handleDelete(h: WageHistory, isLatest: boolean) {
    setDeleting(true)
    const { error } = await supabase.from('worker_wage_history').delete().eq('id', h.id)
    if (error) { toast.error('刪除失敗：' + error.message); setDeleting(false); return }

    // if deleted the latest, sync workers with next record
    if (isLatest && history.length >= 2) {
      const next = history[1]
      await supabase.from('workers').update({
        daily_rate: next.daily_rate,
        overtime_rate: next.overtime_rate,
      }).eq('id', workerId)
    }

    toast.success('調薪記錄已刪除')
    setConfirmDeleteId(null)
    setDeleting(false)
    router.refresh()
  }

  async function handleEditSubmit(e: React.FormEvent, isLatest: boolean) {
    e.preventDefault()
    if (!editingId) return
    const newDaily = parseFloat(editForm.daily_rate)
    const newOvertime = parseFloat(editForm.overtime_rate)
    if (!newDaily || newDaily <= 0) { toast.error('請輸入正確日薪'); return }
    if (!newOvertime || newOvertime <= 0) { toast.error('請輸入正確加班時薪'); return }
    if (!editForm.effective_date) { toast.error('請選擇生效日期'); return }

    setEditSaving(true)
    const ops = [
      supabase.from('worker_wage_history').update({
        daily_rate: newDaily,
        overtime_rate: newOvertime,
        effective_date: editForm.effective_date,
        notes: editForm.notes.trim() || null,
      }).eq('id', editingId),
      ...(isLatest ? [supabase.from('workers').update({
        daily_rate: newDaily,
        overtime_rate: newOvertime,
      }).eq('id', workerId)] : []),
    ]
    const results = await Promise.all(ops)
    setEditSaving(false)

    const err = results.find(r => r.error)?.error
    if (err) { toast.error('儲存失敗：' + err.message); return }

    toast.success('調薪記錄已更新')
    setEditingId(null)
    router.refresh()
  }

  const displayHistory = showAllHistory ? history : history.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          薪資設定
          {!showForm && !editingId && (
            <button
              onClick={() => setShowForm(true)}
              className="ml-auto text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-2.5 py-1 rounded-lg transition-colors"
            >
              調整薪資
            </button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現行薪資 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">現行日薪</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(currentDailyRate)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">現行加班時薪</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(currentOvertimeRate)}</p>
          </div>
        </div>

        {/* 新增調薪表單 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 border border-orange-100 rounded-xl p-4 bg-orange-50/30">
            <p className="text-sm font-semibold text-gray-700">新薪資設定</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="daily_rate">新日薪（NT$）</Label>
                <Input id="daily_rate" name="daily_rate" type="number" min="0" step="1" value={form.daily_rate} onChange={handleChange} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="overtime_rate">新加班時薪（NT$）</Label>
                <Input id="overtime_rate" name="overtime_rate" type="number" min="0" step="1" value={form.overtime_rate} onChange={handleChange} required />
              </div>
            </div>

            {(parseFloat(form.daily_rate) !== currentDailyRate || parseFloat(form.overtime_rate) !== currentOvertimeRate) && (
              <div className="text-xs text-gray-500 space-y-0.5 bg-white border border-gray-100 rounded-lg px-3 py-2">
                {parseFloat(form.daily_rate) !== currentDailyRate && (
                  <p>日薪：{formatCurrency(currentDailyRate)} → <span className={parseFloat(form.daily_rate) > currentDailyRate ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatCurrency(parseFloat(form.daily_rate))}</span>
                    <span className={`ml-1 ${parseFloat(form.daily_rate) > currentDailyRate ? 'text-green-500' : 'text-red-500'}`}>（{parseFloat(form.daily_rate) > currentDailyRate ? '+' : ''}{formatCurrency(parseFloat(form.daily_rate) - currentDailyRate)}）</span>
                  </p>
                )}
                {parseFloat(form.overtime_rate) !== currentOvertimeRate && (
                  <p>加班時薪：{formatCurrency(currentOvertimeRate)} → <span className={parseFloat(form.overtime_rate) > currentOvertimeRate ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatCurrency(parseFloat(form.overtime_rate))}</span>
                    <span className={`ml-1 ${parseFloat(form.overtime_rate) > currentOvertimeRate ? 'text-green-500' : 'text-red-500'}`}>（{parseFloat(form.overtime_rate) > currentOvertimeRate ? '+' : ''}{formatCurrency(parseFloat(form.overtime_rate) - currentOvertimeRate)}）</span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="effective_date">生效日期</Label>
              <Input id="effective_date" name="effective_date" type="date" value={form.effective_date} onChange={handleChange} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">調整原因（選填）</Label>
              <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="例：年度調薪、職務升遷..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">{saving ? '儲存中...' : '確認調整'}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>取消</Button>
            </div>
          </form>
        )}

        {/* 歷史記錄 */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">調薪記錄</p>
            <div className="divide-y divide-gray-50">
              {displayHistory.map((h, i) => (
                <div key={h.id}>
                  {editingId === h.id ? (
                    /* 編輯列 */
                    <form onSubmit={e => handleEditSubmit(e, i === 0)} className="py-3 space-y-3 bg-blue-50/40 rounded-xl px-3 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700">編輯調薪記錄</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor={`e-daily-${h.id}`} className="text-xs">日薪（NT$）</Label>
                          <Input id={`e-daily-${h.id}`} name="daily_rate" type="number" min="0" step="1" value={editForm.daily_rate} onChange={handleEditChange} required />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`e-ot-${h.id}`} className="text-xs">加班時薪（NT$）</Label>
                          <Input id={`e-ot-${h.id}`} name="overtime_rate" type="number" min="0" step="1" value={editForm.overtime_rate} onChange={handleEditChange} required />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`e-date-${h.id}`} className="text-xs">生效日期</Label>
                        <Input id={`e-date-${h.id}`} name="effective_date" type="date" value={editForm.effective_date} onChange={handleEditChange} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`e-notes-${h.id}`} className="text-xs">調整原因</Label>
                        <textarea id={`e-notes-${h.id}`} name="notes" value={editForm.notes} onChange={handleEditChange} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
                      </div>
                      {i === 0 && (
                        <p className="text-[10px] text-blue-500">此為最新記錄，儲存後將同步更新現行薪資</p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={editSaving} className="flex-1">{editSaving ? '儲存中...' : '儲存'}</Button>
                        <Button type="button" size="sm" variant="outline" onClick={cancelEdit} disabled={editSaving}>取消</Button>
                      </div>
                    </form>
                  ) : (
                    /* 正常顯示列 */
                    <div className="py-2.5 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{formatDate(h.effective_date)}</span>
                          {i === 0 && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">最新</span>}
                        </div>
                        {h.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{h.notes}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(h.daily_rate)} <span className="text-xs font-normal text-gray-400">/ 日</span></p>
                          <p className="text-xs text-gray-500">{formatCurrency(h.overtime_rate)} / 加班時</p>
                        </div>
                        {!showForm && !editingId && confirmDeleteId !== h.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(h)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="編輯"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(h.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="刪除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {confirmDeleteId === h.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(h, i === 0)}
                              disabled={deleting}
                              className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                            >
                              {deleting ? '...' : '確認刪除'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deleting}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            >
                              取消
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {history.length > 5 && (
              <button
                onClick={() => setShowAllHistory(v => !v)}
                className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
              >
                {showAllHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showAllHistory ? '收起' : `顯示全部 ${history.length} 筆`}
              </button>
            )}
          </div>
        )}
        {history.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">尚無調薪記錄</p>
        )}
      </CardContent>
    </Card>
  )
}
