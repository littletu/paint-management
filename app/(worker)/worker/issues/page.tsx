import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { KnowledgeTipForm } from '@/components/forms/KnowledgeTipForm'
import { KnowledgeTipCard } from '@/components/knowledge/KnowledgeTipCard'
import { Lightbulb, Trophy } from 'lucide-react'
import Link from 'next/link'
import type { KnowledgeTip, KnowledgeTagGroup } from '@/types'

export default async function WorkerKnowledgePage() {
  const user = await getAuthUser()
  if (!user) return null

  const supabase = await createClient()

  // Check access permission
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
        <Lightbulb className="w-10 h-10 mb-3 opacity-20" />
        <p className="text-sm font-medium text-gray-500">沒有存取權限</p>
        <p className="text-xs mt-1">請聯絡管理員開通妙根老塞功能</p>
      </div>
    )
  }

  const workerId = await getWorkerIdByProfileId(user.id)

  const [{ data: tips }, { data: projects }, { data: knowledgeCategories }, { data: rawTagGroups }] = await Promise.all([
    supabase
      .from('knowledge_tips')
      .select(`
        *,
        worker:workers(profile:profiles(full_name)),
        project:projects(name),
        knowledge_category:knowledge_categories(id, name, color),
        knowledge_comments(
          id, tip_id, worker_id, content, created_at,
          worker:workers(profile:profiles(full_name))
        )
      `)
      // Show approved tips OR own tips (any status)
      .or(workerId ? `status.eq.approved,worker_id.eq.${workerId}` : 'status.eq.approved')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('knowledge_categories')
      .select('id, name, color, points, sort_order')
      .order('sort_order'),
    supabase
      .from('knowledge_tag_groups')
      .select('id, label, sort_order, knowledge_tags(id, label, sort_order)')
      .order('sort_order'),
  ])

  const tagGroups: KnowledgeTagGroup[] = (rawTagGroups ?? []).map(g => ({
    id: g.id,
    label: g.label,
    sort_order: g.sort_order,
    tags: ((g as any).knowledge_tags ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-orange-500" />
            妙根老塞
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            集結師傅智慧，一起傳承施工好手藝
          </p>
        </div>
        <Link
          href="/worker/leaderboard"
          className="flex items-center gap-1.5 text-xs text-orange-600 font-medium bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <Trophy className="w-3.5 h-3.5" />
          排行榜
        </Link>
      </div>

      {/* 新增老塞表單（可收合） */}
      {workerId && (
        <div className="mb-5">
          <KnowledgeTipForm
            workerId={workerId}
            projects={projects ?? []}
            categories={knowledgeCategories ?? []}
            tagGroups={tagGroups}
          />
        </div>
      )}

      {/* 知識列表 */}
      {!tips?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Lightbulb className="w-10 h-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">還沒有老塞</p>
          <p className="text-xs mt-1">成為第一個分享的師傅吧！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tips as KnowledgeTip[]).map(tip => (
            <KnowledgeTipCard
              key={tip.id}
              tip={tip}
              currentWorkerId={workerId ?? ''}
              tagGroups={tagGroups}
            />
          ))}
        </div>
      )}
    </div>
  )
}
