import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { getCachedActiveProjects } from '@/lib/supabase/cached-data'
import { WorkLogForm } from '@/components/forms/WorkLogForm'
import { todayString } from '@/lib/utils/date'

export default async function WorkLogPage() {
  // getAuthUser() is cached by React — layout already called it, no extra network round trip
  const user = await getAuthUser()
  if (!user) return null

  const workerId = await getWorkerIdByProfileId(user.id)

  if (!workerId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>找不到師傅資料，請聯絡管理者。</p>
      </div>
    )
  }

  const today = todayString()
  const supabase = await createClient()

  // Active projects from cross-request cache; today's entries always fresh
  const [activeProjects, { data: todayEntries }] = await Promise.all([
    getCachedActiveProjects(),
    supabase
      .from('time_entries')
      .select('*, project:projects(name)')
      .eq('worker_id', workerId)
      .eq('work_date', today),
  ])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">填寫工時</h1>
        <p className="text-sm text-gray-500 mt-0.5">記錄今日工作情況</p>
      </div>
      <WorkLogForm
        workerId={workerId}
        projects={activeProjects}
        todayEntries={todayEntries ?? []}
        today={today}
      />
    </div>
  )
}
