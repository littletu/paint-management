import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, FolderOpen, MapPin, DollarSign, Hammer } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { ProjectFilters } from '@/components/forms/ProjectFilters'
import { KNOWLEDGE_COLOR_CLASSES } from '@/types'
import { summarizeLabor, type LaborEntry } from '@/lib/utils/finance'
import { getCachedWorkerRates } from '@/lib/supabase/cached-data'

const statusLabel: Record<string, string> = {
  pending: '待開工', active: '進行中', completed: '已完工', cancelled: '已取消',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', active: 'default', completed: 'secondary', cancelled: 'destructive',
}

interface SearchParams {
  status?: string
  customer_id?: string
  q?: string
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const supabase = await createClient()

  const [
    { data: allProjects },
    { data: customers },
    { data: paymentStatuses },
    { data: allEntries },
    { data: allExpenses },
    { data: allReceipts },
    rates,
  ] = await Promise.all([
    supabase.from('projects').select('*, customer:customers(name, id)').order('created_at', { ascending: false }),
    supabase.from('customers').select('id, name').order('name'),
    supabase.from('payment_statuses').select('id, label, color, sort_order').order('sort_order'),
    supabase.from('time_entries').select('project_id, worker_id, regular_days, overtime_hours, transportation_fee, meal_fee, advance_payment, subsidy, other_fee'),
    supabase.from('expenses').select('project_id, amount').not('project_id', 'is', null),
    supabase.from('worker_receipts').select('project_id, amount').not('project_id', 'is', null),
    getCachedWorkerRates(),
  ])

  // 依工程彙總成本（人工 + 開銷 + 發票）
  const entriesByProject = new Map<string, LaborEntry[]>()
  for (const e of (allEntries ?? []) as any[]) {
    if (!e.project_id) continue
    const list = entriesByProject.get(e.project_id) ?? []
    list.push(e)
    entriesByProject.set(e.project_id, list)
  }
  const costByProject = new Map<string, { cost: number; days: number }>()
  for (const [pid, list] of entriesByProject) {
    const labor = summarizeLabor(list, rates)
    costByProject.set(pid, { cost: labor.cost, days: labor.regularDays })
  }
  for (const e of (allExpenses ?? []) as any[]) {
    const cur = costByProject.get(e.project_id) ?? { cost: 0, days: 0 }
    cur.cost += e.amount ?? 0
    costByProject.set(e.project_id, cur)
  }
  for (const r of (allReceipts ?? []) as any[]) {
    const cur = costByProject.get(r.project_id) ?? { cost: 0, days: 0 }
    cur.cost += r.amount ?? 0
    costByProject.set(r.project_id, cur)
  }

  const paymentColorMap = Object.fromEntries(
    (paymentStatuses ?? []).map(ps => [ps.label, KNOWLEDGE_COLOR_CLASSES[ps.color] ?? 'bg-gray-100 text-gray-600'])
  )

  // Client-side filtering
  let projects = allProjects ?? []

  if (sp.status) {
    projects = projects.filter(p => p.status === sp.status)
  }
  if (sp.customer_id) {
    projects = projects.filter(p => (p.customer as any)?.id === sp.customer_id)
  }
  if (sp.q) {
    const q = sp.q.toLowerCase()
    projects = projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.address ?? '').toLowerCase().includes(q)
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工程管理</h1>
        </div>
        <Link href="/projects/new">
          <Button><Plus className="w-4 h-4 mr-2" />新增工程</Button>
        </Link>
      </div>

      <ProjectFilters
        customers={customers ?? []}
        total={allProjects?.length ?? 0}
        filtered={projects.length}
      />

      {!projects.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
            <p>{allProjects?.length ? '沒有符合條件的工程' : '尚無工程資料'}</p>
            {!allProjects?.length && (
              <Link href="/projects/new" className="mt-3">
                <Button variant="outline" size="sm">新增第一筆工程</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project: any) => {
            const summary = costByProject.get(project.id)
            const totalCost = summary?.cost ?? 0
            const workDays = summary?.days ?? 0
            const contract = project.contract_amount ?? 0
            const margin = contract > 0 && totalCost > 0 ? (contract - totalCost) / contract : null
            return <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <Badge variant={statusVariant[project.status]}>{statusLabel[project.status]}</Badge>
                      {project.payment_status && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${paymentColorMap[project.payment_status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {project.payment_status}
                        </span>
                      )}
                      {margin !== null && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${margin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          毛利 {Math.round(margin * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{project.customer?.name}</p>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                      {project.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{project.address}
                        </span>
                      )}
                      {project.start_date && (
                        <span>{formatDate(project.start_date)}{project.end_date ? ` ~ ${formatDate(project.end_date)}` : ''}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {totalCost > 0 && (
                      <div className="flex items-center gap-1 text-sm font-medium text-orange-700 bg-orange-50 px-3 py-1.5 rounded-full">
                        <Hammer className="w-3.5 h-3.5" />
                        {workDays > 0 ? `${workDays} 工・` : ''}成本 {formatCurrency(totalCost)}
                      </div>
                    )}
                    {project.contract_amount && (
                      <div className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatCurrency(project.contract_amount)}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          })}
        </div>
      )}
    </div>
  )
}
