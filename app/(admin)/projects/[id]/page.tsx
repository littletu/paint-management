import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft, Users } from 'lucide-react'
import { AssignWorkerForm } from '@/components/forms/AssignWorkerForm'
import { formatCurrency } from '@/lib/utils/date'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: customers }, { data: assignments }, { data: allWorkers }] = await Promise.all([
    supabase.from('projects').select('*, customer:customers(name)').eq('id', id).single(),
    supabase.from('customers').select('*').order('name'),
    supabase.from('project_workers').select('*, worker:workers(*, profile:profiles(full_name))').eq('project_id', id),
    supabase.from('workers').select('*, profile:profiles(full_name)').eq('is_active', true),
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
                      時薪 {formatCurrency(a.worker?.hourly_rate)} ／ 加班 {formatCurrency(a.worker?.overtime_rate)}
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
    </div>
  )
}
