'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { MessageCircle, ChevronDown, ChevronUp, MapPin, ImagePlus, X, CheckCircle2 } from 'lucide-react'
import type { KnowledgeQuestion, KnowledgeQuestionReply } from '@/types'
import { compressImage } from '@/lib/utils/compress-image'

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  question: KnowledgeQuestion
  currentWorkerId: string
}

export function KnowledgeQuestionCard({ question, currentWorkerId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [replies, setReplies] = useState<KnowledgeQuestionReply[]>([])
  const [repliesLoaded, setRepliesLoaded] = useState(false)
  const [loadingReplies, setLoadingReplies] = useState(false)
  const replyCount = repliesLoaded ? replies.length : (question.knowledge_question_replies?.length ?? 0)

  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!expanded || repliesLoaded) return
    setLoadingReplies(true)
    supabase
      .from('knowledge_question_replies')
      .select('id, question_id, worker_id, content, image_url, created_at, worker:workers(profile:profiles(full_name))')
      .eq('question_id', question.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setReplies((data as KnowledgeQuestionReply[]) ?? [])
        setRepliesLoaded(true)
        setLoadingReplies(false)
      })
  }, [expanded, repliesLoaded, question.id, supabase])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setReplyImage(file)
    const reader = new FileReader()
    reader.onload = ev => setReplyImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeReplyImage() {
    setReplyImage(null)
    setReplyImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleReply() {
    if (!replyText.trim()) { toast.error('請輸入回覆內容'); return }
    setSubmitting(true)

    let image_url: string | null = null
    if (replyImage) {
      const compressed = await compressImage(replyImage)
      const { data: { user } } = await supabase.auth.getUser()
      const ext = compressed.name.split('.').pop()
      const path = `knowledge-q/${user!.id}/reply-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, compressed, { upsert: false })
      if (uploadError) { toast.error('圖片上傳失敗'); setSubmitting(false); return }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { data: inserted, error } = await supabase
      .from('knowledge_question_replies')
      .insert({ question_id: question.id, worker_id: currentWorkerId, content: replyText.trim(), image_url })
      .select('id, question_id, worker_id, content, image_url, created_at, worker:workers(profile:profiles(full_name))')
      .single()

    if (error) { toast.error('回覆失敗：' + error.message); setSubmitting(false); return }

    toast.success('回覆成功！')
    setReplies(prev => [...prev, inserted as KnowledgeQuestionReply])
    setReplyText('')
    removeReplyImage()
    setSubmitting(false)
    router.refresh()
  }

  const categoryColor = question.knowledge_category?.color ?? 'gray'
  const categoryColorMap: Record<string, string> = {
    red: 'bg-red-100 text-red-700',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  const catCls = categoryColorMap[categoryColor] ?? 'bg-gray-100 text-gray-600'

  return (
    <Card className={`border-gray-100 ${question.status === 'resolved' ? 'opacity-80' : ''}`}>
      <CardContent className="px-4 pt-3 pb-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {question.status === 'resolved' && (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  已解決
                </span>
              )}
              {question.knowledge_category && (
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${catCls}`}>
                  {question.knowledge_category.name}
                </span>
              )}
            </div>
            <p className="font-semibold text-gray-900 text-sm leading-snug">{question.title}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-2 flex-wrap">
          <span>{question.worker?.profile?.full_name ?? '師傅'}</span>
          <span>·</span>
          <span suppressHydrationWarning>{formatDate(question.created_at)}</span>
          {question.project && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                {question.project.name}
              </span>
            </>
          )}
        </div>

        {/* Content */}
        {question.content && (
          <p className="text-xs text-gray-600 mb-2 leading-relaxed whitespace-pre-line">{question.content}</p>
        )}

        {/* Image */}
        {question.image_url && (
          <div className="rounded-lg overflow-hidden border border-gray-100 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={question.image_url} alt="問題照片" className="w-full max-h-48 object-cover" />
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors mt-1"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{replyCount > 0 ? `${replyCount} 則回覆` : '回覆'}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Replies section */}
        {expanded && (
          <div className="mt-3 space-y-3">
            {loadingReplies && (
              <div className="space-y-2">
                {[1,2].map(i => <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />)}
              </div>
            )}

            {replies.map(reply => (
              <div key={reply.id} className={`rounded-lg px-3 py-2.5 text-xs ${reply.worker_id === currentWorkerId ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-700">{reply.worker?.profile?.full_name ?? '師傅'}</span>
                  <span className="text-gray-400" suppressHydrationWarning>{formatDate(reply.created_at)}</span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{reply.content}</p>
                {reply.image_url && (
                  <div className="rounded-lg overflow-hidden border border-gray-100 mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={reply.image_url} alt="回覆照片" className="w-full max-h-40 object-cover" />
                  </div>
                )}
              </div>
            ))}

            {repliesLoaded && replies.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-2">還沒有回覆，來幫忙解答吧！</p>
            )}

            {/* Reply input */}
            <div className="space-y-2 pt-1">
              <Textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="輸入你的回覆..."
                rows={2}
                className="text-sm resize-none bg-white"
              />

              {/* Reply image */}
              {replyImagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={replyImagePreview} alt="預覽" className="w-full max-h-32 object-cover" />
                  <button type="button" onClick={removeReplyImage}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors">
                  <ImagePlus className="w-3.5 h-3.5" />
                  附上照片
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

              <Button
                onClick={handleReply}
                disabled={submitting}
                className="w-full bg-blue-500 hover:bg-blue-600"
                size="sm"
              >
                {submitting ? '送出中...' : '送出回覆'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
