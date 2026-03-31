import { createClient } from '@/lib/supabase/server'
import { WorkLogForm } from '@/components/forms/WorkLogForm'
import { todayString } from '@/lib/utils/date'

export default async function WorkLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get worker record
  const { data: worker } = await supabase
    .from('workers')
    .select('id')
    .eq('profile_id', user!.id)
    .single()

  if (!worker) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>找不到師傅資料，請聯絡管理者。</p>
      </div>
    )
  }

  // Get all active projects
  const { data: activeProjects } = await supabase
    .from('projects')
    .select('id, name, address, status')
    .eq('status', 'active')
    .order('name')

  // Check if today's entry exists
  const today = todayString()
  const { data: todayEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('worker_id', worker.id)
    .eq('work_date', today)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">填寫工時</h1>
        <p className="text-sm text-gray-500 mt-0.5">記錄今日工作情況</p>
      </div>
      <WorkLogForm
        workerId={worker.id}
        projects={activeProjects ?? []}
        todayEntries={todayEntries ?? []}
        today={today}
      />
    </div>
  )
}
