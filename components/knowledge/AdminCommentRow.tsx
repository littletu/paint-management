'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Comment {
  id: string
  content: string
  created_at: string
  worker?: { profile?: { full_name: string } }
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('zh-TW', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function AdminCommentRow({ comment }: { comment: Comment }) {
  const supabase = createClient()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(comment.content)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!text.trim()) { toast.error('留言不能為空'); return }
    setLoading(true)
    const { error } = await supabase.from('knowledge_comments').update({ content: text.trim() }).eq('id', comment.id)
    setLoading(false)
    if (error) { toast.error('更新失敗：' + error.message); return }
    toast.success('留言已更新')
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這則留言？')) return
    setLoading(true)
    const { error } = await supabase.from('knowledge_comments').delete().eq('id', comment.id)
    setLoading(false)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('留言已刪除')
    router.refresh()
  }

  const authorName = comment.worker?.profile?.full_name ?? '師傅'

  return (
    <div className="px-5 py-2.5 flex items-start gap-3 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-700">{authorName}</span>
          <span className="text-[10px] text-gray-400" suppressHydrationWarning>{formatDate(comment.created_at)}</span>
        </div>
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={2}
              className="text-xs resize-none bg-white"
              autoFocus
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <Check className="w-3 h-3" />
                {loading ? '儲存中...' : '儲存'}
              </button>
              <button
                onClick={() => { setEditing(false); setText(comment.content) }}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <X className="w-3 h-3" />
                取消
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-600 leading-relaxed">{comment.content}</p>
        )}
      </div>
      {!editing && (
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
            title="編輯留言"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
            title="刪除留言"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
