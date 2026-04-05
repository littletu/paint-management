import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, MessageCircle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KnowledgeTip } from '@/types'
import { KNOWLEDGE_CATEGORY_LABELS, KNOWLEDGE_CATEGORY_COLORS } from '@/types'
import { AdminKnowledgeActions } from '@/components/knowledge/AdminKnowledgeActions'
import { AdminCommentRow } from '@/components/knowledge/AdminCommentRow'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function AdminKnowledgePage() {
  const supabase = await createClient()

  const { data: tips } = await supabase
    .from('knowledge_tips')
    .select(`
      *,
      worker:workers(profile:profiles(full_name)),
      project:projects(name),
      knowledge_comments(
        id, content, created_at,
        worker:workers(profile:profiles(full_name))
      )
    `)
    .order('created_at', { ascending: false })

  const total = tips?.length ?? 0
  const commentTotal = tips?.reduce((acc: number, t: any) => acc + (t.knowledge_comments?.length ?? 0), 0) ?? 0

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-orange-500" />
            妙根老塞
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {total} 則老塞・{commentTotal} 則留言
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700">所有老塞</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {total === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              師傅們還沒有分享老塞 🤫
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {(tips as KnowledgeTip[]).map((tip) => {
                const authorName = tip.worker?.profile?.full_name ?? '—'
                const categoryLabel = KNOWLEDGE_CATEGORY_LABELS[tip.category] ?? tip.category
                const categoryColor = KNOWLEDGE_CATEGORY_COLORS[tip.category] ?? 'bg-gray-100 text-gray-600'
                const comments = (tip as any).knowledge_comments ?? []

                return (
                  <div key={tip.id}>
                    <div className="px-5 py-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Meta row */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', categoryColor)}>
                            {categoryLabel}
                          </span>
                          {tip.project && (
                            <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              <MapPin className="w-2.5 h-2.5" />
                              {tip.project.name}
                            </span>
                          )}
                        </div>
                        {/* 標題 */}
                        <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                        {/* 內容 */}
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed whitespace-pre-line">
                          {tip.content}
                        </p>
                        {tip.reason && (
                          <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded px-2 py-1 leading-relaxed">
                            💡 {tip.reason}
                          </p>
                        )}
                        {/* 底部 */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">✍️ {authorName}</span>
                          <span className="text-xs text-gray-400">{formatDate(tip.created_at)}</span>
                          {comments.length > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-gray-400">
                              <MessageCircle className="w-3 h-3" />
                              {comments.length}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* 編輯 / 刪除按鈕 */}
                      <AdminKnowledgeActions tip={tip} />
                    </div>
                    {/* 留言列表 */}
                    {comments.length > 0 && (
                      <div className="border-t border-gray-50 bg-gray-50/50 divide-y divide-gray-100">
                        {comments.map((c: any) => (
                          <AdminCommentRow key={c.id} comment={c} />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
