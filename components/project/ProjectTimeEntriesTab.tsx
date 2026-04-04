'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Clock } from 'lucide-react'

interface Worker {
  id: string
  name: string
}

interface Props {
  projectId: string
  assignedWorkers: Worker[]
}

export function ProjectTimeEntriesTab({ projectId, assignedWorkers }: Props) {
  const supabase = createClient()
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [workerId, setWorkerId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
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
    fetchEntries()
  }, [projectId, workerId, dateFrom, dateTo])

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
