import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, FolderOpen, MapPin, DollarSign } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'

const statusLabel: Record<string, string> = {
  pending: '待開工', active: '進行中', completed: '已完工', cancelled: '已取消',
}
const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline', active: 'default', completed: 'secondary', cancelled: 'destructive',
}

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select('*, customer:customers(name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工程管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {projects?.length ?? 0} 筆工程</p>
        </div>
        <Link href="/projects/new">
          <Button><Plus className="w-4 h-4 mr-2" />新增工程</Button>
        </Link>
      </div>

      {!projects?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
            <p>尚無工程資料</p>
            <Link href="/projects/new" className="mt-3">
              <Button variant="outline" size="sm">新增第一筆工程</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <Badge variant={statusVariant[project.status]}>{statusLabel[project.status]}</Badge>
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
                  {project.contract_amount && (
                    <div className="flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full shrink-0">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatCurrency(project.contract_amount)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
