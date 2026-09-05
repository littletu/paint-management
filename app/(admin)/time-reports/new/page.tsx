import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SingleTimeEntryForm } from '@/components/forms/SingleTimeEntryForm'

export default async function NewTimeEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ worker_id?: string; back?: string }>
}) {
  const sp = await searchParams
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
    id: w.id,
    name: w.profile?.full_name ?? '未知',
  }))

  const backHref = sp.back ?? '/time-reports'

  return (
    <div>
      <div className="mb-6">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft className="w-4 h-4" />
          返回
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">新增單日工時</h1>
        <p className="text-sm text-gray-500 mt-1">為指定師傅新增單日工時記錄</p>
      </div>

      <div className="max-w-lg">
        <SingleTimeEntryForm
          workers={workerList}
          projects={projects ?? []}
          defaultWorkerId={sp.worker_id ?? ''}
          backHref={backHref}
        />
      </div>
    </div>
  )
}
