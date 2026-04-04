import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BulkTimeEntryForm } from '@/components/forms/BulkTimeEntryForm'

export default async function BulkAddTimeEntryPage() {
  const supabase = await createClient()

  const [{ data: workers }, { data: projects }] = await Promise.all([
    supabase
      .from('workers')
      .select('id, profile:profiles(full_name)')
      .eq('is_active', true)
      .order('id'),
    supabase
      .from('projects')
      .select('id, name')
      .in('status', ['active', 'pending'])
      .order('name'),
  ])

  const workerList = (workers ?? []).map((w: any) => ({
    workerId: w.id,
    id: w.id,
    name: w.profile?.full_name ?? '未知',
  }))

  return (
    <div>
      <div className="mb-6">
        <Link href="/time-reports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          返回工時報表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">批量新增工時</h1>
        <p className="text-sm text-gray-500 mt-1">為特定師傅一次新增兩週（14天）的工時記錄</p>
      </div>

      <BulkTimeEntryForm
        workers={workerList}
        projects={projects ?? []}
      />
    </div>
  )
}
