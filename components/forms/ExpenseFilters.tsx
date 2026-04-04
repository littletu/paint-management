'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface Props {
  projects: Array<{ id: string; name: string }>
  expenseCount: number
  receiptCount: number
}

const TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'project', label: '工程開銷' },
  { value: 'company', label: '公司開銷' },
  { value: 'receipts', label: '師傅發票' },
]

const selectCls = 'h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring'

export function ExpenseFilters({ projects, expenseCount, receiptCount }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const project = searchParams.get('project') ?? ''
  const category = searchParams.get('category') ?? ''
  const dateFrom = searchParams.get('from') ?? ''
  const dateTo = searchParams.get('to') ?? ''
  const type = searchParams.get('type') ?? ''

  const hasFilters = project || category || dateFrom || dateTo || type

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  const clearAll = () => router.push('?')

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        {/* 類型篩選 */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500">顯示</p>
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => update('type', opt.value)}
                className={`h-8 px-3 text-sm rounded-lg border transition-colors ${
                  type === opt.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 工程篩選（工程開銷才顯示） */}
        {(type === '' || type === 'project') && (
          <div className="space-y-1">
            <p className="text-xs text-gray-500">工程</p>
            <select
              value={project}
              onChange={e => update('project', e.target.value)}
              className={selectCls}
            >
              <option value="">全部工程</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 日期區間 */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500">開始日期</p>
          <Input
            type="date"
            value={dateFrom}
            onChange={e => update('from', e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">結束日期</p>
          <Input
            type="date"
            value={dateTo}
            onChange={e => update('to', e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-gray-500 gap-1">
            <X className="w-3.5 h-3.5" />
            清除篩選
          </Button>
        )}
      </div>

      {hasFilters && (
        <p className="text-xs text-gray-500">
          公司開銷 {expenseCount} 筆　師傅發票 {receiptCount} 筆
        </p>
      )}
    </div>
  )
}
