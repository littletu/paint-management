import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId, getWorkerProfile } from '@/lib/supabase/cached-auth'
import { getCachedKnowledgeSettings } from '@/lib/supabase/cached-data'
import { Trophy, Lightbulb, MessageCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const RANK_STYLES = [
  'text-yellow-500',
  'text-gray-400',
  'text-orange-400',
]

const RANK_BG = [
  'bg-yellow-50 border-yellow-200',
  'bg-gray-50 border-gray-200',
  'bg-orange-50 border-orange-200',
]

export default async function LeaderboardPage() {
  const user = await getAuthUser()
  if (!user) return null

  // Permission check + workerId + settings all in parallel (all cached or independent)
  const [profileData, currentWorkerId, { commentPoints }] = await Promise.all([
    getWorkerProfile(user.id),
    getWorkerIdByProfileId(user.id),
    getCachedKnowledgeSettings(),
  ])

  const allowedSections: string[] | null = profileData?.allowed_sections ?? null
  const hasAccess = allowedSections === null || allowedSections.includes('worker-issues')
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 text-center">
        <Trophy className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-medium text-gray-500">沒有存取權限</p>
      </div>
    )
  }

  const supabase = await createClient()

  // Single DB-aggregated query instead of 3 queries + JS aggregation
  const { data: rows } = await supabase.rpc('get_knowledge_leaderboard')

  const leaderboard = (rows ?? [])
    .map((r: any) => ({
      workerId:      r.worker_id,
      fullName:      r.full_name ?? '師傅',
      avatarUrl:     r.avatar_url ?? null,
      tipPoints:     Number(r.tip_points),
      commentPoints: Number(r.comment_count) * commentPoints,
      totalPoints:   Number(r.tip_points) + Number(r.comment_count) * commentPoints,
      approvedCount: Number(r.approved_count),
      commentCount:  Number(r.comment_count),
    }))
    .sort((a: any, b: any) => b.totalPoints - a.totalPoints)

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
          {leaderboard.map((entry: any, idx: number) => {
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
                    <Image
                      src={entry.avatarUrl}
                      alt={entry.fullName}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
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
