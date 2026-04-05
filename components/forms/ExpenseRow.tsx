'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/date'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, ExternalLink, Upload, FileText } from 'lucide-react'
import { compressImage } from '@/lib/utils/compress-image'

interface Expense {
  id: string
  date: string
  category: string
  amount: number
  description: string | null
  receipt_url: string | null
  receipt_name: string | null
  project?: { name: string } | null
}

interface Props {
  expense: Expense
  categories: Array<{ id: string; name: string }>
  showProject?: boolean
}

const selectCls = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring'

export function ExpenseRow({ expense, categories, showProject }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    date: expense.date,
    category: expense.category,
    amount: String(expense.amount),
    description: expense.description ?? '',
  })
  const [file, setFile] = useState<File | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function handleCancel() {
    setForm({
      date: expense.date,
      category: expense.category,
      amount: String(expense.amount),
      description: expense.description ?? '',
    })
    setFile(null)
    setEditing(false)
  }

  async function handleSave() {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('請輸入金額'); return }
    setSaving(true)

    let receipt_url = expense.receipt_url
    let receipt_name = expense.receipt_name

    if (file) {
      const compressed = await compressImage(file)
      const { data: { user } } = await supabase.auth.getUser()
      const ext = compressed.name.split('.').pop()
      const path = `expenses/${user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, compressed, { upsert: false })
      if (uploadError) { toast.error('上傳失敗：' + uploadError.message); setSaving(false); return }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_url = urlData.publicUrl
      receipt_name = compressed.name
    }

    const { error } = await supabase.from('expenses').update({
      date: form.date,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description || null,
      receipt_url,
      receipt_name,
    }).eq('id', expense.id)

    if (error) { toast.error('更新失敗：' + error.message); setSaving(false); return }
    toast.success('已更新')
    setSaving(false)
    setEditing(false)
    setFile(null)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這筆開銷？')) return
    setDeleting(true)
    const { error } = await supabase.from('expenses').delete().eq('id', expense.id)
    if (error) { toast.error('刪除失敗：' + error.message); setDeleting(false); return }
    toast.success('已刪除')
    router.refresh()
  }

  if (editing) {
    return (
      <div className="px-5 py-3.5 bg-orange-50/50 border-b border-orange-100">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input type="date" name="date" value={form.date} onChange={handleChange} className="h-8 text-sm" />
          <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
            <option value="">選擇類別</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="金額" min="0" className="h-8 text-sm" />
          <Textarea name="description" value={form.description} onChange={handleChange} placeholder="說明" rows={1} className="text-sm py-1 resize-none" />
        </div>
        {/* File upload */}
        <div className="mb-2">
          {file ? (
            <div className="flex items-center gap-2 p-2 bg-white border border-orange-200 rounded-lg text-sm">
              <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="flex-1 truncate text-orange-700 text-xs">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-orange-400 hover:text-orange-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {expense.receipt_url ? '更換附件' : '上傳附件'}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
        </div>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
            <Check className="w-3.5 h-3.5" />
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button onClick={handleCancel} disabled={saving}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{expense.description || '—'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 shrink-0">
            {expense.category || '—'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400">
            {formatDate(expense.date)}
            {showProject && (expense.project as any)?.name && (
              <span className="ml-1.5">｜ {(expense.project as any).name}</span>
            )}
          </p>
          {expense.receipt_url && (
            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
              <ExternalLink className="w-3 h-3" />
              {expense.receipt_name ?? '查看附件'}
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 ml-3 shrink-0">
        <span className="font-semibold text-sm text-gray-800 mr-2">{formatCurrency(expense.amount)}</span>
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
