'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { formatCurrency, formatDate } from '@/lib/utils/date'
import { ShoppingCart, ExternalLink, Plus, X } from 'lucide-react'

const categoryLabel: Record<string, string> = {
  material: '材料',
  tool: '工具',
  transportation: '交通',
  other: '其他',
}

interface Expense {
  id: string
  date: string
  category: string
  amount: number
  description: string | null
  receipt_url: string | null
  receipt_name: string | null
}

interface Props {
  projectId: string
  expenses: Expense[]
  totalExpenses: number
  categories?: Array<{ id: string; name: string }>
}

export function ProjectExpensesTab({ projectId, expenses, totalExpenses, categories }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          工程開銷（{expenses.length} 筆）
          {totalExpenses > 0 && (
            <span className="text-sm font-normal text-gray-500">
              合計 {formatCurrency(totalExpenses)}
            </span>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-2.5 py-1 rounded-lg transition-colors"
          >
            {showForm ? <><X className="w-3 h-3" /> 取消</> : <><Plus className="w-3 h-3" /> 新增開銷</>}
          </button>
        </CardTitle>
      </CardHeader>

      {showForm && (
        <div className="px-5 pb-4 border-b border-gray-100">
          <ExpenseForm
            projects={[{ id: projectId, name: '' }]}
            categories={categories}
            defaultProjectId={projectId}
            onSaved={() => setShowForm(false)}
          />
        </div>
      )}

      <CardContent className="p-0">
        {expenses.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">此工程尚無開銷記錄</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.map((e) => (
              <div key={e.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{e.description || '—'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
                      {categoryLabel[e.category] ?? e.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                    {e.receipt_url && (
                      <a href={e.receipt_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
                        <ExternalLink className="w-3 h-3" />
                        {e.receipt_name ?? '查看附件'}
                      </a>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-sm text-gray-800 shrink-0 ml-3">
                  {formatCurrency(e.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
