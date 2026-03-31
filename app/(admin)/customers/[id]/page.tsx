import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CustomerForm } from '@/components/forms/CustomerForm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, FolderOpen } from 'lucide-react'
import type { Project } from '@/types'
import { formatDate } from '@/lib/utils/date'

const statusLabel: Record<string, string> = {
  pending: '待開工',
  active: '進行中',
  completed: '已完工',
  cancelled: '已取消',
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  active: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (!customer) notFound()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
      </div>

      <div className="space-y-6">
        <CustomerForm customer={customer} />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              工程記錄（{projects?.length ?? 0} 筆）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!projects?.length ? (
              <p className="text-sm text-gray-500 text-center py-4">尚無工程記錄</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project: Project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {project.start_date ? formatDate(project.start_date) : '—'}
                          {project.end_date ? ` ~ ${formatDate(project.end_date)}` : ''}
                        </p>
                      </div>
                      <Badge variant={statusVariant[project.status]}>
                        {statusLabel[project.status]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
