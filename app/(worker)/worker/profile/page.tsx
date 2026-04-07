import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { getCachedKnowledgeSettings } from '@/lib/supabase/cached-data'
import { WorkerProfileForm } from '@/components/forms/WorkerProfileForm'
import { Star, Lightbulb, MessageCircle } from 'lucide-react'

export default async function WorkerProfilePage() {
  const user = await getAuthUser()
  if (!user) return null

  const workerId = await getWorkerIdByProfileId(user.id)
  const supabase = await createClient()

  const [
    { data: profile },
    { data: approvedTips },
    { data: comments },
    { commentPoints: commentPointsPerComment },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, phone, id_number, birthday, gender, blood_type, address, mobile, emergency_contact, emergency_phone, avatar_url')
      .eq('id', user.id)
      .single(),
    workerId
      ? supabase
          .from('knowledge_tips')
          .select('knowledge_category:knowledge_categories(points)')
          .eq('worker_id', workerId)
          .eq('status', 'approved')
      : Promise.resolve({ data: [] }),
    workerId
      ? supabase
          .from('knowledge_comments')
          .select('id')
          .eq('worker_id', workerId)
      : Promise.resolve({ data: [] }),
    getCachedKnowledgeSettings(),
  ])
  const tipPoints = (approvedTips ?? []).reduce((sum: number, t: any) => sum + (t.knowledge_category?.points ?? 0), 0)
  const commentPoints = (comments?.length ?? 0) * commentPointsPerComment
  const totalPoints = tipPoints + commentPoints
  const approvedTipCount = approvedTips?.length ?? 0
  const commentCount = comments?.length ?? 0

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">個人資料</h1>
        <p className="text-sm text-gray-500 mt-0.5">修改個人基本資料與登入密碼</p>
      </div>

      {/* 積分卡片 */}
      {workerId && (
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-4 mb-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-sm font-semibold">我的積分</span>
          </div>
          <p className="text-4xl font-bold mb-3">{totalPoints.toLocaleString()}</p>
          <div className="flex items-center gap-4 text-orange-100 text-xs">
            <span className="flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              老塞通過 {approvedTipCount} 則（{tipPoints} 分）
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              留言 {commentCount} 則（{commentPoints} 分）
            </span>
          </div>
        </div>
      )}

      <WorkerProfileForm
        fullName={profile?.full_name ?? ''}
        phone={profile?.phone ?? ''}
        email={user.email ?? ''}
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
