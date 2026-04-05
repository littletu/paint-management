'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Upload, FileText, X, Receipt, Plus, Pencil } from 'lucide-react'
import { compressImage } from '@/lib/utils/compress-image'

interface Project {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface ReceiptEntry {
  id: string
  receipt_date: string
  description: string
  amount: number | null
  category: string | null
  file_url: string | null
  file_name: string | null
  project_id: string | null
  project: { name: string } | null
}

interface Props {
  workerId: string
  workerProfileId: string
  projects: Project[]
  receipts: ReceiptEntry[]
  categories: Category[]
  today: string
}

const selectCls = cn(
  'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
)

const emptyForm = (today: string) => ({
  receipt_date: today,
  description: '',
  amount: '',
  project_id: '',
  category: '',
})


export function WorkerReceiptForm({ workerId, workerProfileId, projects, receipts: initialReceipts, categories, today }: Props) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState(emptyForm(today))
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [receipts, setReceipts] = useState(initialReceipts)
  const [editingId, setEditingId] = useState<string | null>(null)
  // When editing, keep existing file info so we know if there's already an attachment
  const [editingFileUrl, setEditingFileUrl] = useState<string | null>(null)
  const [editingFileName, setEditingFileName] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null)
  }

  function startEdit(r: ReceiptEntry) {
    setEditingId(r.id)
    setEditingFileUrl(r.file_url)
    setEditingFileName(r.file_name)
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setForm({
      receipt_date: r.receipt_date,
      description: r.description,
      amount: r.amount != null ? String(r.amount) : '',
      project_id: r.project_id ?? '',
      category: r.category ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingFileUrl(null)
    setEditingFileName(null)
    setFile(null)
    if (fileRef.current) fileRef.current.value = ''
    setForm(emptyForm(today))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) { toast.error('請填寫費用說明'); return }
    if (!form.receipt_date) { toast.error('請選擇日期'); return }

    setLoading(true)
    try {
      let file_url = editingFileUrl
      let file_name = editingFileName

      if (file) {
        const compressed = await compressImage(file)
        const ext = compressed.name.split('.').pop()
        const path = `${workerProfileId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(path, compressed, { upsert: false })
        if (uploadError) {
          toast.error('檔案上傳失敗：' + uploadError.message)
          return
        }
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
        file_url = urlData.publicUrl
        file_name = compressed.name
      }

      const payload = {
        project_id: form.project_id || null,
        receipt_date: form.receipt_date,
        description: form.description.trim(),
        amount: form.amount ? parseFloat(form.amount) : null,
        category: form.category || null,
        file_url,
        file_name,
      }

      if (editingId) {
        const { data, error } = await supabase
          .from('worker_receipts')
          .update(payload)
          .eq('id', editingId)
          .select('*, project:projects(name)')
          .single()
        if (error) { toast.error('更新失敗：' + error.message); return }
        toast.success('已更新')
        setReceipts(prev => prev.map(r => r.id === editingId ? { ...data, project_id: data.project_id } : r))
        setEditingId(null)
        setEditingFileUrl(null)
        setEditingFileName(null)
      } else {
        const { data, error } = await supabase
          .from('worker_receipts')
          .insert({ worker_id: workerId, ...payload })
          .select('*, project:projects(name)')
          .single()
        if (error) { toast.error('送出失敗：' + error.message); return }
        toast.success('發票已送出')
        setReceipts(prev => [data, ...prev])
      }

      setForm(emptyForm(today))
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('worker_receipts').delete().eq('id', id)
    if (error) { toast.error('刪除失敗'); return }
    setReceipts(prev => prev.filter(r => r.id !== id))
    if (editingId === id) cancelEdit()
    toast.success('已刪除')
  }

  const currentFileUrl = file ? null : editingFileUrl
  const currentFileName = file ? null : editingFileName

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-1.5">
            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {editingId ? '編輯發票 / 收據' : '新增發票 / 收據'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="receipt_date">日期 *</Label>
                <Input
                  id="receipt_date"
                  name="receipt_date"
                  type="date"
                  value={form.receipt_date}
                  max={today}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">金額（NT$）</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="1"
                  inputMode="numeric"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project_id">相關工程</Label>
              <select
                id="project_id"
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                className={cn(selectCls, !form.project_id && 'text-muted-foreground')}
              >
                <option value="">選擇工程（選填）</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">費用類別</Label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={cn(selectCls, !form.category && 'text-muted-foreground')}
              >
                <option value="">選擇類別（選填）</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">費用說明 *</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="材料費、工具費、交通費..."
                rows={2}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>上傳檔案（發票 / 收據）</Label>
              {/* Show existing file when editing */}
              {editingId && currentFileUrl && !file && (
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-1">
                  <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                    {currentFileName ?? '現有附件'}
                  </a>
                  <button
                    type="button"
                    onClick={() => { setEditingFileUrl(null); setEditingFileName(null) }}
                    className="ml-auto text-gray-400 hover:text-red-400 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
                    <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-400">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">{editingId ? '點擊更換檔案' : '點擊上傳圖片或 PDF'}</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? '送出中...' : editingId ? '更新記錄' : '送出發票'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>取消</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {receipts.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">已送出記錄</p>
          {receipts.map(r => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => startEdit(r)}
              onKeyDown={e => e.key === 'Enter' && startEdit(r)}
              className={cn(
                'w-full text-left bg-white rounded-xl border p-3 transition-colors cursor-pointer',
                editingId === r.id
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 hover:bg-gray-50'
              )}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.description}</p>
                    {r.category && (
                      <Badge variant="outline" className="text-xs shrink-0">{r.category}</Badge>
                    )}
                    <Badge variant="secondary" className="text-xs shrink-0">點擊編輯</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {r.receipt_date}
                    {r.project && <span className="ml-1.5 text-orange-600">· {r.project.name}</span>}
                    {r.amount != null && <span className="ml-1.5 font-medium text-gray-700">· NT$ {r.amount.toLocaleString()}</span>}
                  </p>
                  {r.file_url && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                      <FileText className="w-3 h-3" />
                      {r.file_name ?? '附件'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                  className="text-gray-300 hover:text-red-400 p-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
