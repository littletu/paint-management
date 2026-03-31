import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, currentYearMonth } from '@/lib/utils/date'
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react'

interface SearchParams { year?: string; month?: string }

export default async function AccountingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const { year: curYear, month: curMonth } = currentYearMonth()
  const year = parseInt(sp.year ?? String(curYear))
  const month = parseInt(sp.month ?? String(curMonth))
  const pad = (n: number) => String(n).padStart(2, '0')
  const monthStart = `${year}-${pad(month)}-01`
  const monthEnd = `${year}-${pad(month)}-31`

  const supabase = await createClient()

  const [
    { data: confirmedPayrolls },
    { data: expenses },
    { data: projects },
  ] = await Promise.all([
    supabase.from('payroll_records')
      .select('net_amount, worker_id')
      .in('status', ['confirmed', 'paid'])
      .gte('period_start', monthStart)
      .lte('period_end', monthEnd),
    supabase.from('expenses')
      .select('amount, category')
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase.from('projects')
      .select('name, contract_amount, status')
      .eq('status', 'active'),
  ])

  const totalPayroll = confirmedPayrolls?.reduce((s, r) => s + (r.net_amount || 0), 0) ?? 0
  const totalExpenses = expenses?.reduce((s, e) => s + (e.amount || 0), 0) ?? 0
  const totalCost = totalPayroll + totalExpenses
  const totalRevenue = projects?.reduce((s, p) => s + (p.contract_amount || 0), 0) ?? 0

  // Expense breakdown
  const expenseByCategory: Record<string, number> = {}
  for (const e of expenses ?? []) {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (e.amount || 0)
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(curYear, curMonth - 1 - i, 1)
    return { year: d.getFullYear(), month: d.getMonth() + 1 }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">帳目總覽</h1>
        <select
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          defaultValue={`${year}-${month}`}
          onChange={e => {
            const [y, m] = e.target.value.split('-')
            window.location.href = `/accounting?year=${y}&month=${m}`
          }}
        >
          {monthOptions.map(o => (
            <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
              {o.year} 年 {o.month} 月
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-700">在進行工程合約金額</p>
            </div>
            <p className="text-xl font-bold text-green-700">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-700">本月薪資支出</p>
            </div>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalPayroll)}</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <p className="text-xs text-orange-700">本月工程開銷</p>
            </div>
            <p className="text-xl font-bold text-orange-700">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-700">本月總支出</p>
            </div>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">本月薪資明細</CardTitle>
          </CardHeader>
          <CardContent>
            {!confirmedPayrolls?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">尚無確認薪資記錄</p>
            ) : (
              <div className="space-y-1">
                <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                  <span className="text-gray-500">已確認薪資總計</span>
                  <span className="font-bold text-red-600">{formatCurrency(totalPayroll)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">開銷分類</CardTitle>
          </CardHeader>
          <CardContent>
            {!Object.keys(expenseByCategory).length ? (
              <p className="text-sm text-gray-400 text-center py-4">尚無開銷記錄</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(expenseByCategory).map(([cat, amount]) => {
                  const labels: Record<string, string> = { material: '材料', tool: '工具', transportation: '交通', other: '其他' }
                  return (
                    <div key={cat} className="flex justify-between items-center py-1.5 text-sm">
                      <span className="text-gray-600">{labels[cat] ?? cat}</span>
                      <span className="font-medium text-orange-600">{formatCurrency(amount)}</span>
                    </div>
                  )
                })}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm font-bold">
                  <span>合計</span>
                  <span className="text-orange-600">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">進行中工程</CardTitle>
          </CardHeader>
          <CardContent>
            {!projects?.length ? (
              <p className="text-sm text-gray-400 text-center py-4">目前無進行中工程</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 font-medium text-gray-600">工程名稱</th>
                      <th className="text-right py-2 font-medium text-gray-600">合約金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {projects.map((p: any, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="py-2">{p.name}</td>
                        <td className="py-2 text-right font-medium text-green-700">
                          {p.contract_amount ? formatCurrency(p.contract_amount) : '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200 font-bold">
                      <td className="py-2">合計</td>
                      <td className="py-2 text-right text-green-700">{formatCurrency(totalRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
