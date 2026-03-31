import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { Plus, Receipt } from 'lucide-react'

const categoryLabel: Record<string, string> = {
  material: '材料', tool: '工具', transportation: '交通', other: '其他',
}

export default async function ExpensesPage() {
  const supabase = await createClient()

  const [{ data: expenses }, { data: projects }] = await Promise.all([
    supabase.from('expenses')
      .select('*, project:projects(name)')
      .order('date', { ascending: false })
      .limit(100),
    supabase.from('projects').select('id, name').eq('status', 'active').order('name'),
  ])

  const total = expenses?.reduce((s, e) => s + (e.amount || 0), 0) ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">開銷管理</h1>
          <p className="text-sm text-gray-500 mt-1">合計：{formatCurrency(total)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ExpenseForm projects={projects ?? []} />
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                開銷記錄（{expenses?.length ?? 0} 筆）
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {!expenses?.length ? (
                  <p className="text-center text-gray-400 py-10 text-sm">尚無開銷記錄</p>
                ) : expenses.map((expense: any) => (
                  <div key={expense.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{categoryLabel[expense.category]}</Badge>
                        <span className="text-sm font-medium text-gray-900">{expense.description || '—'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(expense.date)} ｜ {(expense.project as any)?.name}
                      </p>
                    </div>
                    <span className="font-semibold text-sm text-red-600">{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
