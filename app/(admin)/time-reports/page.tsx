import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { TimeReportFilters } from '@/components/tables/TimeReportFilters'
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
        <Link
          href="/time-reports/bulk-add"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-200 hover:border-orange-300 px-3 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          批量新增工時
        </Link>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">日期</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">師傅</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">工程</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">天數</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">加班</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">交通</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">餐費</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">代墊</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">補貼</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">其他</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">施工概況</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {entries?.map((entry: any) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.work_date)}</td>
                    <td className="px-4 py-3">{entry.worker?.profile?.full_name}</td>
                    <td className="px-4 py-3">{entry.project?.name}</td>
                    <td className="px-4 py-3 text-right">{entry.regular_days}天</td>
                    <td className="px-4 py-3 text-right text-orange-600">{entry.overtime_hours > 0 ? `${entry.overtime_hours}h` : '—'}</td>
                    <td className="px-4 py-3 text-right">{entry.transportation_fee > 0 ? formatCurrency(entry.transportation_fee) : '—'}</td>
                    <td className="px-4 py-3 text-right">{entry.meal_fee > 0 ? formatCurrency(entry.meal_fee) : '—'}</td>
                    <td className="px-4 py-3 text-right">{entry.advance_payment > 0 ? formatCurrency(entry.advance_payment) : '—'}</td>
                    <td className="px-4 py-3 text-right">{entry.subsidy > 0 ? formatCurrency(entry.subsidy) : '—'}</td>
                    <td className="px-4 py-3 text-right">{entry.other_fee > 0 ? formatCurrency(entry.other_fee) : '—'}</td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-gray-500 text-xs line-clamp-2">{entry.work_progress || '—'}</span>
                    </td>
                  </tr>
                ))}
                {!entries?.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-400">無符合條件的工時記錄</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
