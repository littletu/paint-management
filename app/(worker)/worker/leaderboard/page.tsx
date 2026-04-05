import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { Trophy, Lightbulb, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { COMMENT_POINTS } from '@/types'

const RANK_STYLES = [
  'text-yellow-500',   // 1st
  'text-gray-400',     // 2nd
  'text-orange-400',   // 3rd
]

const RANK_BG = [
  'bg-yellow-50 border-yellow-200',
  'bg-gray-50 border-gray-200',
  'bg-orange-50 border-orange-200',
]

export default async function LeaderboardPage() {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()

  // Check access permission (same gate as worker-issues)
  const { data: profile } = await supabase
    .from('profiles')
    .select('allowed_sections')
    .eq('id', user.id)
    .single()
  const allowedSections: string[] | null = profile?.allowed_sections ?? null
  const hasAccess = allowedSections === null || allowedSections.includes('worker-issues')
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-center">
        <Trophy className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-medium text-gray-500">沒有存取權限</p>
      </div>
    )
  }

  const currentWorkerId = await getWorkerIdByProfileId(user.id)

  const [{ data: workers }, { data: approvedTips }, { data: allComments }] = await Promise.all([
    supabase
      .from('workers')
      .select('id, profile:profiles(full_name, avatar_url)')
      .eq('is_active', true),
    supabase
      .from('knowledge_tips')
      .select('worker_id, knowledge_category:knowledge_categories(points)')
      .eq('status', 'approved'),
    supabase
      .from('knowledge_comments')
      .select('worker_id'),
  ])

  // Aggregate points per worker
  const leaderboard = (workers ?? [])
    .map((w: any) => {
      const tipPoints = (approvedTips ?? [])
        .filter((t: any) => t.worker_id === w.id)
        .reduce((sum: number, t: any) => sum + (t.knowledge_category?.points ?? 0), 0)
      const commentCount = (allComments ?? []).filter((c: any) => c.worker_id === w.id).length
      const commentPoints = commentCount * COMMENT_POINTS
      const approvedCount = (approvedTips ?? []).filter((t: any) => t.worker_id === w.id).length
      return {
        workerId: w.id,
        fullName: w.profile?.full_name ?? '師傅',
        avatarUrl: w.profile?.avatar_url ?? null,
        tipPoints,
        commentPoints,
        totalPoints: tipPoints + commentPoints,
        approvedCount,
        commentCount,
      }
    })
    .filter(w => w.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/worker/issues" className="text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            積分排行榜
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">老塞通過 + 留言累積積分</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Trophy className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm">還沒有積分記錄</p>
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, idx) => {
            const isMe = entry.workerId === currentWorkerId
            const rankStyle = RANK_STYLES[idx] ?? 'text-gray-400'
            const rowBg = idx < 3 ? RANK_BG[idx] : 'bg-white border-gray-100'

            return (
              <div
                key={entry.workerId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                  rowBg,
                  isMe && 'ring-2 ring-orange-400 ring-offset-1'
                )}
              >
                {/* Rank */}
                <div className={cn('w-7 text-center font-bold text-lg shrink-0', rankStyle)}>
                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  {entry.avatarUrl ? (
                    <Image src={entry.avatarUrl} alt={entry.fullName} width={36} height={36} className="object-cover w-full h-full" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">
                      {entry.fullName[0]}
                    </div>
                  )}
                </div>

                {/* Name + breakdown */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    {entry.fullName}
                    {isMe && <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">我</span>}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <Lightbulb className="w-3 h-3" />
                      {entry.approvedCount} 則老塞 · {entry.tipPoints}分
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <MessageCircle className="w-3 h-3" />
                      {entry.commentCount} 留言 · {entry.commentPoints}分
                    </span>
                  </div>
                </div>

                {/* Total points */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-orange-500">{entry.totalPoints}</p>
                  <p className="text-[10px] text-gray-400">積分</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
