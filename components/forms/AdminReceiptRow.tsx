'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, Check, X, ExternalLink } from 'lucide-react'

interface Receipt {
  id: string
  receipt_date: string
  description: string
  amount: number | null
  category: string | null
  file_url: string | null
  file_name: string | null
  worker: { profile: { full_name: string } | null } | null
}

interface Props {
  receipt: Receipt
}

const inputCls = 'h-8 text-sm px-2'
const labelCls = 'text-xs text-gray-500 pt-1'

export function AdminReceiptRow({ receipt }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    receipt_date: receipt.receipt_date,
    description: receipt.description ?? '',
    amount: String(receipt.amount ?? ''),
    category: receipt.category ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase.from('worker_receipts').update({
      receipt_date: form.receipt_date,
      description: form.description.trim(),
      amount: parseFloat(form.amount) || null,
      category: form.category.trim() || null,
    }).eq('id', receipt.id)

    if (error) { toast.error('更新失敗：' + error.message); setSaving(false); return }
    toast.success('已更新')
    setSaving(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('確定要刪除這筆發票記錄？')) return
    const { error } = await supabase.from('worker_receipts').delete().eq('id', receipt.id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    toast.success('已刪除')
    router.refresh()
  }

  if (editing) {
    return (
      <div className="px-5 py-3 bg-orange-50/50 border-b border-orange-100 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={labelCls}>日期</p>
            <Input name="receipt_date" type="date" value={form.receipt_date} onChange={handleChange} className={inputCls} />
          </div>
          <div>
            <p className={labelCls}>金額（NT$）</p>
            <Input name="amount" type="number" min="0" value={form.amount} onChange={handleChange} className={inputCls} placeholder="0" />
          </div>
        </div>
        <div>
          <p className={labelCls}>說明</p>
          <Input name="description" value={form.description} onChange={handleChange} className={inputCls} placeholder="說明" />
        </div>
        <div>
          <p className={labelCls}>類別</p>
          <Input name="category" value={form.category} onChange={handleChange} className={inputCls} placeholder="類別" />
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1 flex-1 justify-center py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors">
            <Check className="w-3.5 h-3.5" />
            {saving ? '儲存中...' : '儲存'}
          </button>
          <button onClick={() => setEditing(false)} disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition-colors">
            <X className="w-3.5 h-3.5" />
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50 group border-b border-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 truncate">{receipt.description}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {receipt.worker?.profile?.full_name}
          </Badge>
          {receipt.category && (
            <Badge variant="secondary" className="text-xs shrink-0">{receipt.category}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-gray-400">{formatDate(receipt.receipt_date)}</p>
          {receipt.file_url && (
            <a href={receipt.file_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline">
              <ExternalLink className="w-3 h-3" />
              {receipt.file_name ?? '查看附件'}
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        <span className="font-semibold text-sm text-gray-800">
          {receipt.amount != null ? formatCurrency(receipt.amount) : '—'}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
