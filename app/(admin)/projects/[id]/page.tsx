import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectInfoPanel } from '@/components/project/ProjectInfoPanel'
import { ProjectExpensesTab } from '@/components/project/ProjectExpensesTab'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Users, FileText, ExternalLink, Receipt, Calendar, Lightbulb, MapPin, MessageCircle } from 'lucide-react'
import { AssignWorkerForm } from '@/components/forms/AssignWorkerForm'
import { formatCurrency, formatDate } from '@/lib/utils/date'
import { KNOWLEDGE_COLOR_CLASSES } from '@/types'
import { cn } from '@/lib/utils'
import { summarizeLabor, computeProjectFinance } from '@/lib/utils/finance'
import { getCachedWorkerRates } from '@/lib/supabase/cached-data'
import { Meter } from '@/components/charts/Meter'
import { DonutChart } from '@/components/charts/DonutChart'
import { ProjectTabs } from '@/components/project/ProjectTabs'
import { ProjectTimeEntriesTab } from '@/components/project/ProjectTimeEntriesTab'
import { AdminReceiptRow } from '@/components/forms/AdminReceiptRow'
import { ProjectNameEditor } from '@/components/project/ProjectNameEditor'

const statusLabel: Record<string, string> = {
  pending: '待開工',
  active: '進行中',
  completed: '已完工',
  cancelled: '已取消',
}

const statusClass: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: project },
    { data: customers },
    { data: assignments },
    { data: allWorkers },
    { data: receipts },
    { data: invoices },
    { data: expenses },
    { data: expenseCategories },
    { data: knowledgeTips },
    { data: paymentStatuses },
    { data: laborEntries },
    laborRates,
  ] = await Promise.all([
    supabase.from('projects').select('*, customer:customers(name)').eq('id', id).single(),
    supabase.from('customers').select('*').order('name'),
    supabase.from('project_workers').select('*, worker:workers(*, profile:profiles(full_name))').eq('project_id', id),
    supabase.from('workers').select('*, profile:profiles(full_name)').eq('is_active', true),
    supabase.from('worker_receipts').select('*, worker:workers(profile:profiles(full_name))').eq('project_id', id).order('receipt_date', { ascending: false }),
    supabase.from('invoices').select('id, invoice_number, total, status').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('expenses').select('id, date, category, amount, description, receipt_url, receipt_name').eq('project_id', id).order('date', { ascending: false }),
    supabase.from('expense_categories').select('id, name, scope').eq('scope', 'project').order('sort_order'),
    supabase.from('knowledge_tips').select('*, worker:workers(profile:profiles(full_name)), knowledge_category:knowledge_categories(id, name, color), knowledge_comments(id)').eq('project_id', id).order('created_at', { ascending: false }),
    supabase.from('payment_statuses').select('id, label, color, sort_order').order('sort_order'),
    supabase.from('time_entries').select('worker_id, regular_days, overtime_hours, transportation_fee, meal_fee, advance_payment, subsidy, other_fee').eq('project_id', id),
    getCachedWorkerRates(),
  ])

  if (!project) notFound()

  const assignedIds = new Set((assignments ?? []).map((a: any) => a.worker_id))
  const unassignedWorkers = (allWorkers ?? []).filter((w: any) => !assignedIds.has(w.id))
  const customer = (project.customer as any)?.name

  // Financial summaries
  const contractAmount = project.contract_amount ?? 0
  const invoiceList = invoices ?? []
  const activeInvoices = invoiceList.filter((inv: any) => inv.status !== 'cancelled')
  const totalInvoiced = activeInvoices.reduce((s: number, inv: any) => s + (inv.total ?? 0), 0)
  const totalPaid = invoiceList.filter((inv: any) => inv.status === 'paid').reduce((s: number, inv: any) => s + (inv.total ?? 0), 0)
  const totalExpenses = (expenses ?? []).reduce((s: number, e: any) => s + (e.amount ?? 0), 0)
  const totalReceipts = (receipts ?? []).reduce((s: number, r: any) => s + (r.amount ?? 0), 0)

  // 人工成本（工時 × 師傅薪率 + 費用，與薪資計算口徑一致）
  const labor = summarizeLabor((laborEntries ?? []) as any, laborRates)
  const fin = computeProjectFinance({
    contractAmount,
    totalInvoiced,
    totalPaid,
    laborCost: labor.cost,
    expenseCost: totalExpenses,
    receiptCost: totalReceipts,
  })

  const tabs = [
    { key: 'info', label: '工程資訊' },
    { key: 'workers', label: '師傅', count: assignments?.length ?? 0 },
    { key: 'time', label: '工時' },
    { key: 'invoices', label: '請款單', count: invoiceList.length },
    { key: 'expenses', label: '開銷', count: (expenses ?? []).length },
    { key: 'receipts', label: '師傅發票', count: receipts?.length ?? 0 },
    { key: 'tips', label: '妙根老塞', count: knowledgeTips?.length ?? 0 },
  ]

  const assignedWorkers = (assignments ?? []).map((a: any) => ({
    id: a.worker_id,
    name: a.worker?.profile?.full_name ?? '',
  }))

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          返回工程列表
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            {customer && <p className="text-sm text-gray-500 mb-1">{customer}</p>}
            <div className="flex items-center gap-3 flex-wrap">
              <ProjectNameEditor projectId={id} initialName={project.name} />
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClass[project.status]}`}>
                {statusLabel[project.status]}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {project.start_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  開始 {formatDate(project.start_date)}
                </span>
              )}
              {project.end_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  結束 {formatDate(project.end_date)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1.5">合約金額</p>
          <p className="text-lg font-bold text-gray-900">{contractAmount > 0 ? formatCurrency(contractAmount) : '—'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1.5">已請款</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(totalInvoiced)}</p>
          {contractAmount > 0 && totalInvoiced > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{Math.round(totalInvoiced / contractAmount * 100)}%</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1.5">已收款</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          {totalInvoiced > 0 && totalPaid < totalInvoiced && (
            <p className="text-xs text-gray-400 mt-0.5">尚餘 {formatCurrency(totalInvoiced - totalPaid)}</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1.5">總成本</p>
          <p className="text-lg font-bold text-gray-800">{fin.totalCost > 0 ? formatCurrency(fin.totalCost) : '—'}</p>
          {fin.revenueBase > 0 && fin.totalCost > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">占收入 {Math.round(fin.totalCost / fin.revenueBase * 100)}%</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1.5">預估毛利</p>
          {fin.revenueBase > 0 ? (
            <>
              <p className={`text-lg font-bold ${fin.grossProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(fin.grossProfit)}
              </p>
              {fin.grossMargin !== null && (
                <p className={`text-xs mt-0.5 ${fin.grossProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  毛利率 {Math.round(fin.grossMargin * 100)}%
                </p>
              )}
            </>
          ) : (
            <p className="text-lg font-bold text-gray-400">—</p>
          )}
        </div>
      </div>

      {/* 收支評估 */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <p className="text-sm font-semibold text-gray-800 mb-4">收支評估</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
          <div className="space-y-4">
            <Meter
              label="請款進度（已請款 ÷ 合約金額）"
              ratio={contractAmount > 0 ? totalInvoiced / contractAmount : 0}
              valueText={contractAmount > 0 ? `${Math.round(totalInvoiced / contractAmount * 100)}%` : '未設定合約金額'}
              dangerOnOverflow={false}
            />
            <Meter
              label="收款進度（已收款 ÷ 已請款）"
              ratio={totalInvoiced > 0 ? totalPaid / totalInvoiced : 0}
              valueText={totalInvoiced > 0 ? `${Math.round(totalPaid / totalInvoiced * 100)}%` : '尚未請款'}
              dangerOnOverflow={false}
            />
            <Meter
              label="成本占收入（總成本 ÷ 收入基準）"
              ratio={fin.revenueBase > 0 ? fin.totalCost / fin.revenueBase : 0}
              valueText={fin.revenueBase > 0 ? `${Math.round(fin.totalCost / fin.revenueBase * 100)}%` : '—'}
            />
            <p className="text-xs text-gray-400 pt-1">
              人工明細：{labor.regularDays} 工／加班 {labor.overtimeHours} 小時
              {labor.feeCost > 0 && `／費用 ${formatCurrency(labor.feeCost)}`}
            </p>
          </div>
          <DonutChart
            centerLabel="總成本"
            segments={[
              { label: '人工成本', value: labor.cost, color: '#2a78d6' },
              { label: '工程開銷', value: totalExpenses, color: '#1baf7a' },
              { label: '師傅發票', value: totalReceipts, color: '#eda100' },
            ]}
          />
        </div>
      </div>

      {/* Tabs */}
      <ProjectTabs tabs={tabs}>
        {/* Tab 0: 工程資訊 */}
        <div>
          <ProjectInfoPanel project={project} customers={customers ?? []} paymentStatuses={paymentStatuses ?? []} />
        </div>

        {/* Tab 1: 師傅 */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                指派師傅（{assignments?.length ?? 0} 位）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {(assignments ?? []).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">尚未指派師傅</p>
                )}
                {(assignments ?? []).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{a.worker?.profile?.full_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        日薪 {formatCurrency(a.worker?.daily_rate)} ／ 加班 {formatCurrency(a.worker?.overtime_rate)}
                      </p>
                    </div>
                    <Badge variant="secondary">已指派</Badge>
                  </div>
                ))}
              </div>
              {unassignedWorkers.length > 0 && (
                <AssignWorkerForm projectId={id} workers={unassignedWorkers} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab 2: 工時 */}
        <div>
          <ProjectTimeEntriesTab projectId={id} assignedWorkers={assignedWorkers} />
        </div>

        {/* Tab 3: 請款單 */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                請款單（{invoiceList.length} 筆）
                {totalInvoiced > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    合計 {formatCurrency(totalInvoiced)}
                  </span>
                )}
                <Link
                  href={`/invoices/new?project_id=${id}`}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <span>＋</span> 新增請款單
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoiceList.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">此工程尚無請款單</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {invoiceList.map((inv: any) => (
                    <Link key={inv.id} href={`/invoices/${inv.id}`}>
                      <div className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-mono font-semibold text-sm text-gray-900">{inv.invoice_number}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                            inv.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                            inv.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {inv.status === 'paid' ? '已付款' : inv.status === 'sent' ? '已送出' : inv.status === 'cancelled' ? '已取消' : '草稿'}
                          </span>
                          <span className="font-semibold text-sm text-gray-800">{formatCurrency(inv.total)}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tab 3: 開銷 */}
        <div>
          <ProjectExpensesTab
            projectId={id}
            expenses={expenses ?? []}
            totalExpenses={totalExpenses}
            categories={expenseCategories ?? []}
          />
        </div>

        {/* Tab 5: 師傅發票 */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                師傅發票記錄（{receipts?.length ?? 0} 筆）
                {totalReceipts > 0 && (
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    合計 {formatCurrency(totalReceipts)}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!receipts?.length ? (
                <p className="text-center text-gray-400 py-8 text-sm">此工程尚無師傅發票記錄</p>
              ) : (
                <div>
                  {receipts.map((r: any) => (
                    <AdminReceiptRow key={r.id} receipt={r} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Tab 6: 妙根老塞 */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-500" />
                妙根老塞（{knowledgeTips?.length ?? 0} 則）
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!knowledgeTips?.length ? (
                <p className="text-center text-gray-400 py-10 text-sm">此工程尚無相關老塞</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {knowledgeTips.map((tip: any) => {
                    const categoryLabel = tip.knowledge_category?.name ?? tip.category
                    const categoryColor = KNOWLEDGE_COLOR_CLASSES[tip.knowledge_category?.color ?? ''] ?? 'bg-gray-100 text-gray-600'
                    const authorName = tip.worker?.profile?.full_name ?? '—'
                    const commentCount = tip.knowledge_comments?.length ?? 0
                    return (
                      <div key={tip.id} className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', categoryColor)}>
                            {categoryLabel}
                          </span>
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(tip.created_at)}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-3 whitespace-pre-line">{tip.content}</p>
                        {tip.reason && (
                          <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded px-2 py-1 leading-relaxed">
                            💡 {tip.reason}
                          </p>
                        )}
                        {tip.image_url && (
                          <a href={tip.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={tip.image_url} alt="附圖" className="h-24 w-auto rounded-lg border border-gray-200 object-cover" />
                          </a>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">✍️ {authorName}</span>
                          {commentCount > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-400">
                              <MessageCircle className="w-3 h-3" />
                              {commentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProjectTabs>
    </div>
  )
}
