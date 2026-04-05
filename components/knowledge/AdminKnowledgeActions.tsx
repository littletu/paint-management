'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Trash2, Pencil, X, Check, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KnowledgeDBCategory } from '@/types'
import { TagSelector } from '@/components/knowledge/TagSelector'

interface Tip {
  id: string
  title: string
  content: string
  reason: string | null
  category: string
  category_id: string | null
  status: string
  tags: string[]
}

interface Props {
  tip: Tip
  categories: KnowledgeDBCategory[]
}

export function AdminKnowledgeActions({ tip, categories }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(tip.status)
  const [editTags, setEditTags] = useState<string[]>(tip.tags ?? [])
  const [form, setForm] = useState({
    title: tip.title,
    content: tip.content,
    reason: tip.reason ?? '',
    category_id: tip.category_id ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('請填寫標題'); return }
    if (!form.content.trim()) { toast.error('請填寫內容'); return }
    setLoading(true)
    const { error } = await supabase.from('knowledge_tips').update({
      title: form.title.trim(),
      content: form.content.trim(),
      reason: form.reason.trim() || null,
      category_id: form.category_id || null,
      tags: editTags,
    }).eq('id', tip.id)
    setLoading(false)
    if (error) { toast.error('更新失敗：' + error.message); return }
    toast.success('已更新')
    setEditing(false)
    router.refresh()
  }

  async function handleSetStatus(newStatus: 'approved' | 'rejected' | 'pending') {
    setLoading(true)
    const { error } = await supabase.from('knowledge_tips').update({ status: newStatus }).eq('id', tip.id)
    setLoading(false)
    if (error) { toast.error('更新失敗：' + error.message); return }
    setCurrentStatus(newStatus)
    const labels = { approved: '已審核通過', rejected: '已駁回', pending: '已重設為待審核' }
    toast.success(labels[newStatus])
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這則老塞？此操作無法復原。')) return
    setLoading(true)
    const { error } = await supabase.from('knowledge_tips').delete().eq('id', tip.id)
    setLoading(false)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('已刪除')
    router.refresh()
  }

  if (editing) {
    return (
      <div className="border-t border-orange-100 bg-orange-50/40 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-600">編輯老塞</p>
          <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">碰到的問題或技巧</label>
          <Input name="title" value={form.title} onChange={handleChange} className="text-sm bg-white" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">你的做法或建議</label>
          <Textarea name="content" value={form.content} onChange={handleChange} rows={3} className="text-sm bg-white resize-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">為什麼要這樣做？</label>
          <Textarea name="reason" value={form.reason} onChange={handleChange} rows={2} className="text-sm bg-white resize-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1 block">分類</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className={cn(
              'w-full h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none',
              'focus-visible:border-ring'
            )}
          >
            <option value="">無分類</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-2 block">標籤</label>
          <TagSelector selected={editTags} onChange={setEditTags} />
        </div>

        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={loading} className="flex-1 gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {loading ? '儲存中...' : '儲存'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={loading}>
            取消
          </Button>
        </div>
      </div>
    )
  }

  const tipPoints = categories.find(c => c.id === tip.category_id)?.points ?? null

  return (
    <div className="flex gap-1 shrink-0 flex-wrap justify-end">
      {currentStatus === 'pending' && (
        <>
          <button
            onClick={() => handleSetStatus('approved')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-40"
            title="審核通過"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            通過{tipPoints !== null ? ` +${tipPoints}分` : ''}
          </button>
          <button
            onClick={() => handleSetStatus('rejected')}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-40"
            title="駁回"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            駁回
          </button>
        </>
      )}
      {(currentStatus === 'approved' || currentStatus === 'rejected') && (
        <button
          onClick={() => handleSetStatus('pending')}
          disabled={loading}
          className="p-2 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40"
          title="重設為待審核"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        onClick={() => setEditing(true)}
        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
        title="編輯"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        title="刪除"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
