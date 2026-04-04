import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/date'
import { ExpenseForm } from '@/components/forms/ExpenseForm'
import { ExpenseFilters } from '@/components/forms/ExpenseFilters'
import { ExpenseRow } from '@/components/forms/ExpenseRow'
import { AdminReceiptRow } from '@/components/forms/AdminReceiptRow'
import { Receipt, FileText } from 'lucide-react'

interface SearchParams {
  project?: string
  category?: string
  from?: string
  to?: string
  type?: string
}

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { project, category, from: dateFrom, to: dateTo, type } = await searchParams
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

  const [{ data: expenses }, { data: projects }, { data: receipts }, { data: allExpenseCategories }] = await Promise.all([
    expenseQuery,
    supabase.from('projects').select('id, name').order('name'),
    receiptQuery,
    supabase.from('expense_categories').select('id, name, scope').order('sort_order'),
  ])

  const expenseCategories = (allExpenseCategories ?? []).filter((c: any) => c.scope === 'project')
  const companyExpenseCategories = (allExpenseCategories ?? []).filter((c: any) => c.scope === 'company')

  const projectExpenses = (expenses ?? []).filter((e: any) => e.expense_type === 'project' || (!e.expense_type && e.project_id))
  const companyExpenses = (expenses ?? []).filter((e: any) => e.expense_type === 'company' || (!e.expense_type && !e.project_id))
  const projectExpenseTotal = projectExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const companyExpenseTotal = companyExpenses.reduce((s, e) => s + (e.amount || 0), 0)
  const expenseTotal = (expenses ?? []).reduce((s, e) => s + (e.amount || 0), 0)
  const receiptTotal = receipts?.reduce((s, r) => s + (r.amount || 0), 0) ?? 0

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">開銷管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          工程開銷 {formatCurrency(projectExpenseTotal)}　公司開銷 {formatCurrency(companyExpenseTotal)}　師傅發票 {formatCurrency(receiptTotal)}　合計 {formatCurrency(expenseTotal + receiptTotal)}
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
          <ExpenseForm projects={projects ?? []} categories={expenseCategories ?? []} companyCategories={companyExpenseCategories ?? []} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* 工程開銷 */}
          {(!type || type === 'project') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  工程開銷（{projectExpenses.length} 筆）
                  <span className="ml-auto text-sm font-normal text-gray-500">{formatCurrency(projectExpenseTotal)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {!projectExpenses.length ? (
                    <p className="text-center text-gray-400 py-10 text-sm">尚無工程開銷記錄</p>
                  ) : projectExpenses.map((expense: any) => (
                    <ExpenseRow key={expense.id} expense={expense} categories={expenseCategories} showProject />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 公司開銷 */}
          {(!type || type === 'company') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  公司開銷（{companyExpenses.length} 筆）
                  <span className="ml-auto text-sm font-normal text-gray-500">{formatCurrency(companyExpenseTotal)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-50">
                  {!companyExpenses.length ? (
                    <p className="text-center text-gray-400 py-10 text-sm">尚無公司開銷記錄</p>
                  ) : companyExpenses.map((expense: any) => (
                    <ExpenseRow key={expense.id} expense={expense} categories={companyExpenseCategories} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 師傅發票 */}
          {(!type || type === 'receipts') && (
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
                    <AdminReceiptRow key={r.id} receipt={r} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
