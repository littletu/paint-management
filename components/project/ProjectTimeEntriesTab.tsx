'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Clock, Printer, Pencil, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface Worker {
  id: string
  name: string
}

interface Props {
  projectId: string
  assignedWorkers: Worker[]
}

interface EditForm {
  work_date: string
  worker_id: string
  regular_days: string
  overtime_hours: string
  transportation_fee: string
  meal_fee: string
  advance_payment: string
  subsidy: string
  other_fee: string
  work_progress: string
}

function entryToForm(e: any): EditForm {
  return {
    work_date: e.work_date ?? '',
    worker_id: e.worker_id ?? '',
    regular_days: String(e.regular_days ?? 0),
    overtime_hours: String(e.overtime_hours ?? 0),
    transportation_fee: String(e.transportation_fee ?? 0),
    meal_fee: String(e.meal_fee ?? 0),
    advance_payment: String(e.advance_payment ?? 0),
    subsidy: String(e.subsidy ?? 0),
    other_fee: String(e.other_fee ?? 0),
    work_progress: e.work_progress ?? '',
  }
}

const numInput = 'w-20 h-7 rounded border border-gray-200 px-1.5 text-xs text-right outline-none focus:border-orange-400'
const dateInput = 'h-7 rounded border border-gray-200 px-1.5 text-xs outline-none focus:border-orange-400'
const selectInput = 'h-7 rounded border border-gray-200 px-1.5 text-xs outline-none focus:border-orange-400 max-w-[100px]'

export function ProjectTimeEntriesTab({ projectId, assignedWorkers }: Props) {
  const supabase = createClient()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [workerId, setWorkerId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function fetchEntries() {
    setLoading(true)
    let query = supabase
      .from('time_entries')
      .select('*, worker:workers(profile:profiles(full_name))')
      .eq('project_id', projectId)
      .order('work_date', { ascending: false })

    if (workerId) query = query.eq('worker_id', workerId)
    if (dateFrom) query = query.gte('work_date', dateFrom)
    if (dateTo) query = query.lte('work_date', dateTo)

    const { data } = await query
    setEntries(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchEntries() }, [projectId, workerId, dateFrom, dateTo])

  function startEdit(entry: any) {
    setEditingId(entry.id)
    setEditForm(entryToForm(entry))
    setConfirmDeleteId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm(null)
  }

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setEditForm(p => p ? { ...p, [e.target.name]: e.target.value } : p)
  }

  async function handleSave(id: string) {
    if (!editForm) return
    setSaving(true)
    const { error } = await supabase.from('time_entries').update({
      work_date: editForm.work_date,
      worker_id: editForm.worker_id || null,
      regular_days: parseFloat(editForm.regular_days) || 0,
      overtime_hours: parseFloat(editForm.overtime_hours) || 0,
      transportation_fee: parseFloat(editForm.transportation_fee) || 0,
      meal_fee: parseFloat(editForm.meal_fee) || 0,
      advance_payment: parseFloat(editForm.advance_payment) || 0,
      subsidy: parseFloat(editForm.subsidy) || 0,
      other_fee: parseFloat(editForm.other_fee) || 0,
      work_progress: editForm.work_progress.trim() || null,
    }).eq('id', id)
    setSaving(false)

    if (error) { toast.error('儲存失敗：' + error.message); return }
    toast.success('工時記錄已更新')
    cancelEdit()
    fetchEntries()
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const { error } = await supabase.from('time_entries').delete().eq('id', id)
    setDeleting(false)

    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('工時記錄已刪除')
    setConfirmDeleteId(null)
    fetchEntries()
  }

  const totalDays = entries.reduce((s, e) => s + (e.regular_days || 0), 0)
  const totalOvertime = entries.reduce((s, e) => s + (e.overtime_hours || 0), 0)
  const totalFees = entries.reduce((s, e) =>
    s + (e.transportation_fee || 0) + (e.meal_fee || 0) + (e.advance_payment || 0) + (e.subsidy || 0) + (e.other_fee || 0), 0)

  const selectCls = 'h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:border-orange-400'
  const inputCls = 'h-8 rounded-lg border border-gray-200 bg-white px-2.5 text-sm outline-none focus:border-orange-400'

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">師傅</label>
              <select value={workerId} onChange={e => setWorkerId(e.target.value)} className={selectCls}>
                <option value="">全部師傅</option>
                {assignedWorkers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">開始日期</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">結束日期</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
            </div>
            {(workerId || dateFrom || dateTo) && (
              <button
                onClick={() => { setWorkerId(''); setDateFrom(''); setDateTo('') }}
                className="h-8 px-3 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                清除篩選
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">總工數</p>
            <p className="text-lg font-bold text-gray-900">{totalDays} 天</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">加班時數</p>
            <p className="text-lg font-bold text-orange-600">{totalOvertime} h</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">各項費用</p>
            <p className="text-base font-bold text-blue-600">{formatCurrency(totalFees)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            工時記錄（{loading ? '...' : entries.length} 筆）
            <button
              onClick={() => {
                const params = new URLSearchParams()
                if (workerId) params.set('worker_id', workerId)
                if (dateFrom) params.set('date_from', dateFrom)
                if (dateTo) params.set('date_to', dateTo)
                const qs = params.toString()
                window.open(`/projects/${projectId}/time-entries/print${qs ? `?${qs}` : ''}`, '_blank')
              }}
              disabled={loading || entries.length === 0}
              className="ml-auto flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              列印工時記錄
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">載入中...</p>
          ) : entries.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">無符合條件的工時記錄</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">日期</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">師傅</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">工數</th>
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
                  {entries.map((entry: any) => {
                    const isEditing = editingId === entry.id
                    const isConfirmDelete = confirmDeleteId === entry.id

                    if (isEditing && editForm) {
                      return (
                        <tr key={entry.id} className="bg-blue-50/40">
                          <td className="px-2 py-2">
                            <input type="date" name="work_date" value={editForm.work_date} onChange={handleEditChange} className={dateInput} />
                          </td>
                          <td className="px-2 py-2">
                            <select name="worker_id" value={editForm.worker_id} onChange={handleEditChange} className={selectInput}>
                              <option value="">—</option>
                              {assignedWorkers.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="regular_days" value={editForm.regular_days} onChange={handleEditChange} min="0" step="0.5" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="overtime_hours" value={editForm.overtime_hours} onChange={handleEditChange} min="0" step="0.5" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="transportation_fee" value={editForm.transportation_fee} onChange={handleEditChange} min="0" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="meal_fee" value={editForm.meal_fee} onChange={handleEditChange} min="0" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="advance_payment" value={editForm.advance_payment} onChange={handleEditChange} min="0" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="subsidy" value={editForm.subsidy} onChange={handleEditChange} min="0" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" name="other_fee" value={editForm.other_fee} onChange={handleEditChange} min="0" className={numInput} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="text" name="work_progress" value={editForm.work_progress} onChange={handleEditChange} placeholder="施工概況" className="h-7 w-36 rounded border border-gray-200 px-1.5 text-xs outline-none focus:border-orange-400" />
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleSave(entry.id)}
                                disabled={saving}
                                className="p-1.5 text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
                                title="儲存"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={saving}
                                className="p-1.5 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                title="取消"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr key={entry.id} className={`hover:bg-gray-50 ${isConfirmDelete ? 'bg-red-50/40' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.work_date)}</td>
                        <td className="px-4 py-3">{entry.worker?.profile?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-right">{entry.regular_days}天</td>
                        <td className="px-4 py-3 text-right text-orange-600">{entry.overtime_hours > 0 ? `${entry.overtime_hours}h` : '—'}</td>
                        <td className="px-4 py-3 text-right">{entry.transportation_fee > 0 ? formatCurrency(entry.transportation_fee) : '—'}</td>
                        <td className="px-4 py-3 text-right">{entry.meal_fee > 0 ? formatCurrency(entry.meal_fee) : '—'}</td>
                        <td className="px-4 py-3 text-right">{entry.advance_payment > 0 ? formatCurrency(entry.advance_payment) : '—'}</td>
                        <td className="px-4 py-3 text-right">{entry.subsidy > 0 ? formatCurrency(entry.subsidy) : '—'}</td>
                        <td className="px-4 py-3 text-right">{entry.other_fee > 0 ? formatCurrency(entry.other_fee) : '—'}</td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <span className="text-gray-500 text-xs line-clamp-2">{entry.work_progress || '—'}</span>
                        </td>
                        <td className="px-3 py-3">
                          {isConfirmDelete ? (
                            <div className="flex items-center gap-1 whitespace-nowrap">
                              <button
                                onClick={() => handleDelete(entry.id)}
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
                          ) : (
                            <div className="flex items-center gap-1">
                              {!editingId && (
                                <>
                                  <button
                                    onClick={() => startEdit(entry)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="編輯"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteId(entry.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="刪除"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
