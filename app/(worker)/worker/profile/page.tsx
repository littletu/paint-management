import { createClient } from '@/lib/supabase/server'
import { WorkerProfileForm } from '@/components/forms/WorkerProfileForm'

export default async function WorkerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, id_number, birthday, gender, blood_type, address, mobile, emergency_contact, emergency_phone, avatar_url')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">個人資料</h1>
        <p className="text-sm text-gray-500 mt-0.5">修改個人基本資料與登入密碼</p>
      </div>
      <WorkerProfileForm
        fullName={profile?.full_name ?? ''}
        phone={profile?.phone ?? ''}
        email={user!.email ?? ''}
        idNumber={profile?.id_number ?? ''}
        birthday={profile?.birthday ?? ''}
        gender={profile?.gender ?? ''}
        bloodType={profile?.blood_type ?? ''}
        address={profile?.address ?? ''}
        mobile={profile?.mobile ?? ''}
        emergencyContact={profile?.emergency_contact ?? ''}
        emergencyPhone={profile?.emergency_phone ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
      />
    </div>
  )
}
