import { createClient } from '@/lib/supabase/server'
import { WorkerProfileForm } from '@/components/forms/WorkerProfileForm'

export default async function WorkerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">個人資料</h1>
        <p className="text-sm text-gray-500 mt-0.5">修改姓名、電話與登入密碼</p>
      </div>
      <WorkerProfileForm
        fullName={profile?.full_name ?? ''}
        phone={profile?.phone ?? ''}
        email={user!.email ?? ''}
      />
    </div>
  )
}
