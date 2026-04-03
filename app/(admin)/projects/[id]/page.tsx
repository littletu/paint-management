import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Users, FileText, ExternalLink } from 'lucide-react'
import { AssignWorkerForm } from '@/components/forms/AssignWorkerForm'
import { formatCurrency, formatDate } from '@/lib/utils/date'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: customers }, { data: assignments }, { data: allWorkers }, { data: receipts }] = await Promise.all([
    supabase.from('projects').select('*, customer:customers(name)').eq('id', id).single(),
    supabase.from('customers').select('*').order('name'),
    supabase.from('project_workers').select('*, worker:workers(*, profile:profiles(full_name))').eq('project_id', id),
    supabase.from('workers').select('*, profile:profiles(full_name)').eq('is_active', true),
    supabase.from('worker_receipts').select('*, worker:workers(profile:profiles(full_name))').eq('project_id', id).order('receipt_date', { ascending: false }),
  ])

  if (!project) notFound()

  const assignedIds = new Set((assignments ?? []).map((a: any) => a.worker_id))
  const unassignedWorkers = (allWorkers ?? []).filter((w: any) => !assignedIds.has(w.id))

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/projects" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">{(project.customer as any)?.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <ProjectForm project={project} customers={customers ?? []} />

        {/* Assigned Workers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              指派師傅（{assignments?.length ?? 0} 位）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {(assignments ?? []).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{a.worker?.profile?.full_name}</p>
                    <p className="text-xs text-gray-500">
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

        {/* 發票記錄 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              師傅發票記錄（{receipts?.length ?? 0} 筆）
              {(receipts?.length ?? 0) > 0 && (
                <span className="ml-auto text-sm font-normal text-gray-500">
                  合計：{formatCurrency(receipts!.reduce((s, r) => s + (r.amount ?? 0), 0))}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!receipts?.length ? (
              <p className="text-center text-gray-400 py-8 text-sm">此工程尚無發票記錄</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {receipts.map((r: any) => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{r.description}</span>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {(r.worker as any)?.profile?.full_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-500">{formatDate(r.receipt_date)}</p>
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
                    <span className="font-semibold text-sm text-gray-800 shrink-0 ml-3">
                      {r.amount != null ? formatCurrency(r.amount) : '—'}
                    </span>
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
