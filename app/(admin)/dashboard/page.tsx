import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, currentYearMonth } from '@/lib/utils/date'
import { Users, FolderOpen, Clock, Wallet, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { year, month } = currentYearMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const monthStart = `${year}-${pad(month)}-01`
  const monthEnd = `${year}-${pad(month)}-31`
  const today = new Date().toISOString().slice(0, 10)

  const [
    { count: workerCount },
    { count: activeProjectCount },
    { data: activeProjects },
    { data: todayEntries },
    { data: pendingPayrolls },
    { data: recentProgress },
  ] = await Promise.all([
    supabase.from('workers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('projects').select('name, contract_amount, status, customer:customers(name)').eq('status', 'active').limit(5),
    supabase.from('time_entries').select('worker:workers(profile:profiles(full_name)), regular_hours, overtime_hours').eq('work_date', today),
    supabase.from('payroll_records').select('id, worker:workers(profile:profiles(full_name)), net_amount, period_start, period_end').eq('status', 'draft').limit(5),
    supabase.from('time_entries').select('work_date, work_progress, worker:workers(profile:profiles(full_name)), project:projects(name)').not('work_progress', 'is', null).order('submitted_at', { ascending: false }).limit(8),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">儀表板</h1>
        <p className="text-sm text-gray-500 mt-1">{year} 年 {month} 月</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-lg">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">在職師傅</p>
                <p className="text-2xl font-bold text-gray-900">{workerCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2.5 rounded-lg">
                <FolderOpen className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">進行中工程</p>
                <p className="text-2xl font-bold text-gray-900">{activeProjectCount ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2.5 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">今日出勤</p>
                <p className="text-2xl font-bold text-gray-900">{todayEntries?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2.5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">待確認薪資</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPayrolls?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>進行中工程</span>
              <Link href="/projects" className="text-xs text-orange-500 font-normal hover:underline">查看全部</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!activeProjects?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">目前無進行中工程</p>
              ) : activeProjects.map((p: any) => (
                <Link key={p.id ?? p.name} href={`/projects`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-500">{(p.customer as any)?.name}</p>
                    </div>
                    {p.contract_amount && (
                      <span className="text-xs font-medium text-green-700">{formatCurrency(p.contract_amount)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payrolls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>待確認薪資</span>
              <Link href="/payroll" className="text-xs text-orange-500 font-normal hover:underline">前往薪資管理</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!pendingPayrolls?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">無待確認薪資</p>
              ) : pendingPayrolls.map((r: any) => (
                <Link key={r.id} href={`/payroll/${r.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{(r.worker as any)?.profile?.full_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(r.period_start)} ~ {formatDate(r.period_end)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-orange-600">{formatCurrency(r.net_amount)}</span>
                      <Badge variant="outline" className="text-xs">待確認</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Work Progress */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>最新施工概況</span>
              <Link href="/time-reports" className="text-xs text-orange-500 font-normal hover:underline">查看工時報表</Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!recentProgress?.length ? (
                <p className="text-sm text-gray-400 text-center py-4">尚無施工概況記錄</p>
              ) : recentProgress.map((entry: any) => (
                <div key={entry.id} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{(entry.worker as any)?.profile?.full_name}</span>
                      <span className="text-xs text-gray-400">｜</span>
                      <span className="text-xs text-gray-500">{(entry.project as any)?.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(entry.work_date)}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{entry.work_progress}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
