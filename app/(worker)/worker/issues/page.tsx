import { createClient } from '@/lib/supabase/server'
import { getAuthUser, getWorkerIdByProfileId } from '@/lib/supabase/cached-auth'
import { KnowledgeTipForm } from '@/components/forms/KnowledgeTipForm'
import { KnowledgeTipCard } from '@/components/knowledge/KnowledgeTipCard'
import { Lightbulb } from 'lucide-react'
import type { KnowledgeTip } from '@/types'

export default async function WorkerKnowledgePage() {
  const user = await getAuthUser()
  if (!user) return null

  const workerId = await getWorkerIdByProfileId(user.id)
  const supabase = await createClient()

  // 並行取得：所有師傅的知識條目（含留言）、所有進行中工程、分類
  const [{ data: tips }, { data: projects }, { data: knowledgeCategories }] = await Promise.all([
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
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
    supabase
      .from('knowledge_categories')
      .select('id, name, color, sort_order')
      .order('sort_order'),
  ])

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-orange-500" />
          妙根老塞
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          集結師傅智慧，一起傳承施工好手藝
        </p>
      </div>

      {/* 新增老塞表單（可收合） */}
      {workerId && (
        <div className="mb-5">
          <KnowledgeTipForm
            workerId={workerId}
            projects={projects ?? []}
            categories={knowledgeCategories ?? []}
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
            />
          ))}
        </div>
      )}
    </div>
  )
}
