import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/date'
import { TimeReportFilters } from '@/components/tables/TimeReportFilters'
import { TimeReportTable } from '@/components/tables/TimeReportTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface SearchParams {
  worker_id?: string
  project_id?: string
  date_from?: string
  date_to?: string
}

export default async function TimeReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: workers }, { data: projects }] = await Promise.all([
    supabase.from('workers').select('id, profile:profiles(full_name)').eq('is_active', true),
    supabase.from('projects').select('id, name').order('name'),
  ])

  let query = supabase
    .from('time_entries')
    .select('*, worker:workers(profile:profiles(full_name)), project:projects(name)')
    .order('work_date', { ascending: false })
    .limit(200)

  if (sp.worker_id) query = query.eq('worker_id', sp.worker_id)
  if (sp.project_id) query = query.eq('project_id', sp.project_id)
  if (sp.date_from) query = query.gte('work_date', sp.date_from)
  if (sp.date_to) query = query.lte('work_date', sp.date_to)

  const { data: entries } = await query

  const totalRegular = entries?.reduce((s, e) => s + (e.regular_days || 0), 0) ?? 0
  const totalOvertime = entries?.reduce((s, e) => s + (e.overtime_hours || 0), 0) ?? 0
  const totalFees = entries?.reduce((s, e) =>
    s + (e.transportation_fee || 0) + (e.meal_fee || 0) + (e.advance_payment || 0) + (e.subsidy || 0) + (e.other_fee || 0), 0) ?? 0

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">工時報表</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/time-reports/new"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增單日工時
          </Link>
          <Link
            href="/time-reports/bulk-add"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            批量新增工時
          </Link>
        </div>
      </div>

      <TimeReportFilters
        workers={workers ?? []}
        projects={projects ?? []}
        currentFilters={sp}
      />

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 my-6">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">工數</p>
            <p className="text-xl font-bold text-gray-900">{totalRegular}天</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">加班時數</p>
            <p className="text-xl font-bold text-orange-600">{totalOvertime}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">各項費用</p>
            <p className="text-base font-bold text-blue-600">{formatCurrency(totalFees)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">共 {entries?.length ?? 0} 筆</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TimeReportTable
            entries={entries ?? []}
            projects={projects ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
