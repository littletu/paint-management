'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { MessageCircle, ChevronDown, ChevronUp, MapPin, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KnowledgeTip, KnowledgeComment } from '@/types'
import { KNOWLEDGE_CATEGORY_LABELS, KNOWLEDGE_CATEGORY_COLORS } from '@/types'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  tip: KnowledgeTip
  currentWorkerId: string
}

export function KnowledgeTipCard({ tip, currentWorkerId }: Props) {
  const supabase = createClient()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<KnowledgeComment[]>(tip.knowledge_comments ?? [])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const authorName = tip.worker?.profile?.full_name ?? '師傅'
  const categoryLabel = KNOWLEDGE_CATEGORY_LABELS[tip.category] ?? tip.category
  const categoryColor = KNOWLEDGE_CATEGORY_COLORS[tip.category] ?? 'bg-gray-100 text-gray-600'

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    if (!currentWorkerId) { toast.error('找不到師傅資料'); return }

    setSubmitting(true)
    const { data, error } = await supabase
      .from('knowledge_comments')
      .insert({
        tip_id: tip.id,
        worker_id: currentWorkerId,
        content: commentText.trim(),
      })
      .select('*, worker:workers(profile:profiles(full_name))')
      .single()

    if (error) {
      toast.error('留言失敗：' + error.message)
    } else {
      setComments(prev => [...prev, data as KnowledgeComment])
      setCommentText('')
    }
    setSubmitting(false)
  }

  return (
    <Card className="border-gray-100 overflow-hidden">
      <CardContent className="p-0">
        {/* 主體區塊 */}
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left px-4 pt-4 pb-3"
        >
          {/* 頂部 meta */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', categoryColor)}>
              {categoryLabel}
            </span>
            {tip.project && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {tip.project.name}
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-auto" suppressHydrationWarning>{formatDate(tip.created_at)}</span>
          </div>

          {/* 標題 */}
          <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{tip.title}</p>

          {/* 作者 + 展開指示 */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">✍️ {authorName}</span>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {tip.image_url && <ImageIcon className="w-3.5 h-3.5 text-blue-400" />}
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {comments.length}
              </span>
              {expanded
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </div>
          </div>
        </button>

        {/* 展開區：完整內容 + 留言 */}
        {expanded && (
          <div className="border-t border-gray-100">
            {/* 完整內容 */}
            <div className="px-4 py-3 bg-amber-50/50 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {tip.content}
              </p>
              {tip.reason && (
                <div className="rounded-lg bg-amber-100/60 px-3 py-2">
                  <p className="text-[10px] font-semibold text-amber-700 mb-0.5">為什麼要這樣做？</p>
                  <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{tip.reason}</p>
                </div>
              )}
              {/* 附圖 */}
              {tip.image_url && (
                <a href={tip.image_url} target="_blank" rel="noopener noreferrer" className="block mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tip.image_url}
                    alt="附圖"
                    className="w-full rounded-lg border border-amber-100 object-cover max-h-72"
                  />
                </a>
              )}
            </div>

            {/* 留言列表 */}
            {comments.length > 0 && (
              <div className="divide-y divide-gray-50 border-t border-gray-100">
                {comments.map(comment => (
                  <div key={comment.id} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {comment.worker?.profile?.full_name ?? '師傅'}
                      </span>
                      <span className="text-[10px] text-gray-400" suppressHydrationWarning>{formatDate(comment.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 留言輸入 */}
            <form onSubmit={handleComment} className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <Textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="加個留言或補充..."
                rows={1}
                className="text-xs resize-none flex-1 min-h-0"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleComment(e as unknown as React.FormEvent)
                  }
                }}
              />
              <Button
                type="submit"
                size="sm"
                disabled={submitting || !commentText.trim()}
                className="shrink-0 self-end"
              >
                送出
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
