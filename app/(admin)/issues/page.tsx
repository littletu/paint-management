import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb, MessageCircle, MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KnowledgeTip } from '@/types'
import { KNOWLEDGE_COLOR_CLASSES } from '@/types'
import { AdminKnowledgeActions } from '@/components/knowledge/AdminKnowledgeActions'
import { AdminCommentRow } from '@/components/knowledge/AdminCommentRow'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', {
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const statusBadge: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}
const statusLabel: Record<string, string> = {
  pending:  '待審核',
  approved: '已通過',
  rejected: '已駁回',
}

function TipRow({ tip, categories }: { tip: KnowledgeTip; categories: any[] }) {
  const authorName = (tip as any).worker?.profile?.full_name ?? '—'
  const categoryLabel = tip.knowledge_category?.name ?? tip.category
  const categoryColor = KNOWLEDGE_COLOR_CLASSES[tip.knowledge_category?.color ?? ''] ?? 'bg-gray-100 text-gray-600'
  const comments = (tip as any).knowledge_comments ?? []

  return (
    <div>
      <div className="px-5 py-4 flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Meta row */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', categoryColor)}>
              {categoryLabel}
            </span>
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', statusBadge[tip.status] ?? 'bg-gray-100 text-gray-600')}>
              {statusLabel[tip.status] ?? tip.status}
            </span>
            {(tip as any).project && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {(tip as any).project.name}
              </span>
            )}
          </div>
          {/* 標題 */}
          <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
          {/* 內容 */}
          <p className="text-xs text-gray-500 mt-1 leading-relaxed whitespace-pre-line">{tip.content}</p>
          {tip.reason && (
            <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 rounded px-2 py-1 leading-relaxed">
              💡 {tip.reason}
            </p>
          )}
          {tip.image_url && (
            <a href={tip.image_url} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tip.image_url} alt="附圖" className="h-32 w-auto rounded-lg border border-gray-200 object-cover" />
            </a>
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
        {/* 動作按鈕 */}
        <AdminKnowledgeActions tip={tip} categories={categories} />
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
}

export default async function AdminKnowledgePage() {
  const supabase = await createClient()

  const [{ data: tips }, { data: knowledgeCategories }] = await Promise.all([
    supabase
      .from('knowledge_tips')
      .select(`
        *,
        worker:workers(profile:profiles(full_name)),
        project:projects(name),
        knowledge_category:knowledge_categories(id, name, color),
        knowledge_comments(
          id, content, created_at,
          worker:workers(profile:profiles(full_name))
        )
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('knowledge_categories')
      .select('id, name, color, points, sort_order')
      .order('sort_order'),
  ])

  const allTips = (tips ?? []) as KnowledgeTip[]
  const pending  = allTips.filter(t => t.status === 'pending')
  const rest     = allTips.filter(t => t.status !== 'pending')

  const approvedCount = allTips.filter(t => t.status === 'approved').length
  const commentTotal  = allTips.reduce((acc, t) => acc + ((t as any).knowledge_comments?.length ?? 0), 0)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-orange-500" />
            妙根老塞
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            已通過 {approvedCount} 則・待審核 {pending.length} 則・{commentTotal} 則留言
          </p>
        </div>
      </div>

      {/* 待審核區塊 */}
      {pending.length > 0 && (
        <Card className="mb-6 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-yellow-700 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              待審核（{pending.length}）
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-yellow-50">
              {pending.map(tip => (
                <TipRow key={tip.id} tip={tip} categories={knowledgeCategories ?? []} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 其餘老塞 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-700">所有老塞</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rest.length === 0 ? (
            <p className="text-center text-gray-400 py-12 text-sm">
              師傅們還沒有分享老塞 🤫
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {rest.map(tip => (
                <TipRow key={tip.id} tip={tip} categories={knowledgeCategories ?? []} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
