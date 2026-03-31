import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { WorkerForm } from '@/components/forms/WorkerForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: worker } = await supabase
    .from('workers')
    .select('*, profile:profiles(*)')
    .eq('id', id)
    .single()

  if (!worker) notFound()

  // Recent time entries
  const { data: recentEntries } = await supabase
    .from('time_entries')
    .select('*, project:projects(name)')
    .eq('worker_id', id)
    .order('work_date', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/workers" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{(worker.profile as any)?.full_name}</h1>
      </div>

      <div className="space-y-6">
        <WorkerForm worker={worker as any} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              近期工時記錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentEntries?.length ? (
              <p className="text-sm text-gray-500 text-center py-4">尚無工時記錄</p>
            ) : (
              <div className="space-y-2">
                {recentEntries.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{formatDate(entry.work_date)}</p>
                      <p className="text-gray-500 text-xs">{(entry.project as any)?.name}</p>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <p>正常 {entry.regular_hours}h ／ 加班 {entry.overtime_hours}h</p>
                      <p className="text-gray-500">
                        {formatCurrency(
                          (entry.transportation_fee || 0) +
                          (entry.meal_fee || 0) +
                          (entry.advance_payment || 0) +
                          (entry.subsidy || 0) +
                          (entry.other_fee || 0)
                        )} 費用
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
