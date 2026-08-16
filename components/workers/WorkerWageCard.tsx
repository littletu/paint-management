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
import { TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

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

export function WorkerWageCard({ workerId, currentDailyRate, currentOvertimeRate, history }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    daily_rate: String(currentDailyRate),
    overtime_rate: String(currentOvertimeRate),
    effective_date: new Date().toISOString().slice(0, 10),
    notes: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
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

  const displayHistory = showAllHistory ? history : history.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          薪資設定
          {!showForm && (
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

        {/* 調整表單 */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 border border-orange-100 rounded-xl p-4 bg-orange-50/30">
            <p className="text-sm font-semibold text-gray-700">新薪資設定</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="daily_rate">新日薪（NT$）</Label>
                <Input
                  id="daily_rate"
                  name="daily_rate"
                  type="number"
                  min="0"
                  step="1"
                  value={form.daily_rate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="overtime_rate">新加班時薪（NT$）</Label>
                <Input
                  id="overtime_rate"
                  name="overtime_rate"
                  type="number"
                  min="0"
                  step="1"
                  value={form.overtime_rate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 變動預覽 */}
            {(parseFloat(form.daily_rate) !== currentDailyRate || parseFloat(form.overtime_rate) !== currentOvertimeRate) && (
              <div className="text-xs text-gray-500 space-y-0.5 bg-white border border-gray-100 rounded-lg px-3 py-2">
                {parseFloat(form.daily_rate) !== currentDailyRate && (
                  <p>日薪：{formatCurrency(currentDailyRate)} → <span className={parseFloat(form.daily_rate) > currentDailyRate ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatCurrency(parseFloat(form.daily_rate))}</span>
                    <span className={`ml-1 ${parseFloat(form.daily_rate) > currentDailyRate ? 'text-green-500' : 'text-red-500'}`}>
                      （{parseFloat(form.daily_rate) > currentDailyRate ? '+' : ''}{formatCurrency(parseFloat(form.daily_rate) - currentDailyRate)}）
                    </span>
                  </p>
                )}
                {parseFloat(form.overtime_rate) !== currentOvertimeRate && (
                  <p>加班時薪：{formatCurrency(currentOvertimeRate)} → <span className={parseFloat(form.overtime_rate) > currentOvertimeRate ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatCurrency(parseFloat(form.overtime_rate))}</span>
                    <span className={`ml-1 ${parseFloat(form.overtime_rate) > currentOvertimeRate ? 'text-green-500' : 'text-red-500'}`}>
                      （{parseFloat(form.overtime_rate) > currentOvertimeRate ? '+' : ''}{formatCurrency(parseFloat(form.overtime_rate) - currentOvertimeRate)}）
                    </span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="effective_date">生效日期</Label>
              <Input
                id="effective_date"
                name="effective_date"
                type="date"
                value={form.effective_date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">調整原因（選填）</Label>
              <textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="例：年度調薪、職務升遷..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? '儲存中...' : '確認調整'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
                取消
              </Button>
            </div>
          </form>
        )}

        {/* 歷史記錄 */}
        {history.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">調薪記錄</p>
            <div className="divide-y divide-gray-50">
              {displayHistory.map((h, i) => (
                <div key={h.id} className="py-2.5 flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{formatDate(h.effective_date)}</span>
                      {i === 0 && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">最新</span>}
                    </div>
                    {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(h.daily_rate)} <span className="text-xs font-normal text-gray-400">/ 日</span></p>
                    <p className="text-xs text-gray-500">{formatCurrency(h.overtime_rate)} / 加班時</p>
                  </div>
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
