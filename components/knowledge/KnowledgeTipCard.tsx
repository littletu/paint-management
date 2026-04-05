'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MessageCircle, ChevronDown, ChevronUp, MapPin, ImageIcon, Pencil, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KnowledgeTip, KnowledgeComment } from '@/types'
import { KNOWLEDGE_COLOR_CLASSES } from '@/types'
import { TagSelector } from '@/components/knowledge/TagSelector'

const TIP_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending:  { label: '⏳ 待審核', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '❌ 已駁回', cls: 'bg-red-100 text-red-700' },
}

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
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<KnowledgeComment[]>(tip.knowledge_comments ?? [])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Edit state
  const isOwner = currentWorkerId && tip.worker_id === currentWorkerId
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  // Local display copy — updated optimistically after save
  const [display, setDisplay] = useState({
    title: tip.title,
    content: tip.content,
    reason: tip.reason ?? '',
  })
  const [editForm, setEditForm] = useState({
    title: tip.title,
    content: tip.content,
    reason: tip.reason ?? '',
  })
  const [editTags, setEditTags] = useState<string[]>(tip.tags ?? [])

  const authorName = tip.worker?.profile?.full_name ?? '師傅'
  const categoryLabel = tip.knowledge_category?.name ?? tip.category
  const categoryColor = KNOWLEDGE_COLOR_CLASSES[tip.knowledge_category?.color ?? ''] ?? 'bg-gray-100 text-gray-600'

  function handleEditChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!editForm.title.trim()) { toast.error('請填寫標題'); return }
    if (!editForm.content.trim()) { toast.error('請填寫內容'); return }
    setSaving(true)
    const { error } = await supabase.from('knowledge_tips').update({
      title: editForm.title.trim(),
      content: editForm.content.trim(),
      reason: editForm.reason.trim() || null,
      tags: editTags,
      status: 'pending',   // reset to pending for re-review after edit
    }).eq('id', tip.id)
    setSaving(false)
    if (error) { toast.error('更新失敗：' + error.message); return }
    toast.success('已更新')
    setDisplay({ title: editForm.title.trim(), content: editForm.content.trim(), reason: editForm.reason.trim() })
    setEditing(false)
    router.refresh()
  }

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
          onClick={() => { if (!editing) setExpanded(v => !v) }}
          className="w-full text-left px-4 pt-4 pb-3"
        >
          {/* 頂部 meta */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', categoryColor)}>
              {categoryLabel}
            </span>
            {isOwner && TIP_STATUS_BADGE[tip.status] && (
              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', TIP_STATUS_BADGE[tip.status].cls)}>
                {TIP_STATUS_BADGE[tip.status].label}
              </span>
            )}
            {tip.project && (
              <span className="flex items-center gap-0.5 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                <MapPin className="w-2.5 h-2.5" />
                {tip.project.name}
              </span>
            )}
            <span className="text-[10px] text-gray-400 ml-auto" suppressHydrationWarning>{formatDate(tip.created_at)}</span>
          </div>

          {/* 標題 */}
          <p className="text-sm font-semibold text-gray-900 leading-snug mb-1">{display.title}</p>

          {/* 標籤 */}
          {tip.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {tip.tags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  {tag}
                </span>
              ))}
            </div>
          )}

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
            {editing ? (
              /* ── 編輯表單 ── */
              <div className="px-4 py-3 bg-orange-50/50 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block">碰到的問題或技巧</label>
                  <Input name="title" value={editForm.title} onChange={handleEditChange} className="text-sm bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block">你的做法或建議</label>
                  <Textarea name="content" value={editForm.content} onChange={handleEditChange} rows={3} className="text-sm bg-white resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-1 block">為什麼要這樣做？</label>
                  <Textarea name="reason" value={editForm.reason} onChange={handleEditChange} rows={2} className="text-sm bg-white resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 mb-2 block">標籤</label>
                  <TagSelector selected={editTags} onChange={setEditTags} />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving} className="flex-1 gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    {saving ? '儲存中...' : '儲存'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(false); setEditForm({ title: display.title, content: display.content, reason: display.reason }); setEditTags(tip.tags ?? []) }} disabled={saving}>
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              /* ── 內容顯示 ── */
              <div className="px-4 py-3 bg-amber-50/50 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line flex-1">
                    {display.content}
                  </p>
                  {isOwner && (
                    <button
                      onClick={e => { e.stopPropagation(); setEditing(true) }}
                      className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-100 transition-colors"
                      title="編輯"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {display.reason && (
                  <div className="rounded-lg bg-amber-100/60 px-3 py-2">
                    <p className="text-[10px] font-semibold text-amber-700 mb-0.5">為什麼要這樣做？</p>
                    <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line">{display.reason}</p>
                  </div>
                )}
                {tip.image_url && (
                  <a href={tip.image_url} target="_blank" rel="noopener noreferrer" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tip.image_url}
                      alt="附圖"
                      className="w-full rounded-lg border border-amber-100 object-cover max-h-72"
                    />
                  </a>
                )}
              </div>
            )}

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
