import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { ExpenseFilters } from '@/components/forms/ExpenseFilters'
import { Receipt, FileText, ExternalLink } from 'lucide-react'

const categoryLabel: Record<string, string> = {
  material: '材料', tool: '工具', transportation: '交通', other: '其他',
}

interface SearchParams {
  project?: string
  category?: string
  from?: string
  to?: string
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { project, category, from: dateFrom, to: dateTo } = await searchParams
  const supabase = await createClient()

  // Build expenses query
  let expenseQuery = supabase
    .from('expenses')
    .select('*, project:projects(name)')
    .order('date', { ascending: false })
    .limit(200)
  if (project) expenseQuery = expenseQuery.eq('project_id', project)
  if (category) expenseQuery = expenseQuery.eq('category', category)
  if (dateFrom) expenseQuery = expenseQuery.gte('date', dateFrom)
  if (dateTo) expenseQuery = expenseQuery.lte('date', dateTo)

  // Build receipts query
  let receiptQuery = supabase
    .from('worker_receipts')
    .select('*, worker:workers(profile:profiles(full_name)), project:projects(name)')
    .order('receipt_date', { ascending: false })
    .limit(200)
  if (project) receiptQuery = receiptQuery.eq('project_id', project)
  if (dateFrom) receiptQuery = receiptQuery.gte('receipt_date', dateFrom)
  if (dateTo) receiptQuery = receiptQuery.lte('receipt_date', dateTo)

  const [{ data: expenses }, { data: projects }, { data: receipts }] = await Promise.all([
    expenseQuery,
    supabase.from('projects').select('id, name').order('name'),
    receiptQuery,
  ])

  const expenseTotal = expenses?.reduce((s, e) => s + (e.amount || 0), 0) ?? 0
  const receiptTotal = receipts?.reduce((s, r) => s + (r.amount || 0), 0) ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">開銷管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          公司開銷 {formatCurrency(expenseTotal)}　師傅發票 {formatCurrency(receiptTotal)}　合計 {formatCurrency(expenseTotal + receiptTotal)}
        </p>
      </div>

      {/* 篩選列 */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
        <ExpenseFilters
          projects={projects ?? []}
          expenseCount={expenses?.length ?? 0}
          receiptCount={receipts?.length ?? 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ExpenseForm projects={(projects ?? []).filter((p: any) => true)} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* 公司開銷 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                公司開銷（{expenses?.length ?? 0} 筆）
                <span className="ml-auto text-sm font-normal text-gray-500">{formatCurrency(expenseTotal)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {!expenses?.length ? (
                  <p className="text-center text-gray-400 py-10 text-sm">尚無符合條件的開銷記錄</p>
                ) : expenses.map((expense: any) => (
                  <div key={expense.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">{categoryLabel[expense.category]}</Badge>
                        <span className="text-sm font-medium text-gray-900 truncate">{expense.description || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">
                          {formatDate(expense.date)} ｜ {(expense.project as any)?.name ?? '—'}
                        </p>
                        {expense.receipt_url && (
                          <a
                            href={expense.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {expense.receipt_name ?? '查看發票'}
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-red-600 shrink-0 ml-3">{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 師傅發票 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                師傅發票（{receipts?.length ?? 0} 筆）
                <span className="ml-auto text-sm font-normal text-gray-500">{formatCurrency(receiptTotal)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-50">
                {!receipts?.length ? (
                  <p className="text-center text-gray-400 py-10 text-sm">尚無符合條件的師傅發票記錄</p>
                ) : receipts.map((r: any) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {(r.worker as any)?.profile?.full_name ?? '—'}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 truncate">{r.description}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">
                          {formatDate(r.receipt_date)}
                          {(r.project as any)?.name && <span className="ml-1.5 text-orange-600">· {(r.project as any).name}</span>}
                        </p>
                        {r.file_url && (
                          <a
                            href={r.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {r.file_name ?? '查看附件'}
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-sm text-red-600 shrink-0 ml-3">
                      {r.amount != null ? formatCurrency(r.amount) : '—'}
                    </span>
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
