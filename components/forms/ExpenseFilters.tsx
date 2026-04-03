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

const categories = [
  { value: '', label: '全部類別' },
  { value: 'material', label: '材料' },
  { value: 'tool', label: '工具' },
  { value: 'transportation', label: '交通' },
  { value: 'other', label: '其他' },
]

const selectCls = 'h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring'

export function ExpenseFilters({ projects, expenseCount, receiptCount }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const project = searchParams.get('project') ?? ''
  const category = searchParams.get('category') ?? ''
  const dateFrom = searchParams.get('from') ?? ''
  const dateTo = searchParams.get('to') ?? ''

  const hasFilters = project || category || dateFrom || dateTo

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
        {/* 工程篩選 */}
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

        {/* 類別篩選（只對公司開銷） */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500">類別</p>
          <select
            value={category}
            onChange={e => update('category', e.target.value)}
            className={selectCls}
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

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
