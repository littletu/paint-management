'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { todayString } from '@/lib/utils/date'
import { Plus, Upload, X, FileText } from 'lucide-react'

interface Props {
  projects: Array<{ id: string; name: string }>
  defaultProjectId?: string
  onSaved?: () => void
}

const selectCls = 'w-full h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export function ExpenseForm({ projects, defaultProjectId, onSaved }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    project_id: defaultProjectId ?? '',
    date: todayString(),
    category: 'material' as const,
    amount: '',
    description: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 10 * 1024 * 1024) { toast.error('檔案大小不能超過 10MB'); return }
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.project_id) { toast.error('請選擇工程'); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error('請輸入金額'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    let receipt_url: string | null = null
    let receipt_name: string | null = null

    if (file) {
      const ext = file.name.split('.').pop()
      const path = `expenses/${user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, file, { upsert: false })
      if (uploadError) {
        toast.error('發票上傳失敗：' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      receipt_url = urlData.publicUrl
      receipt_name = file.name
    }

    const { error } = await supabase.from('expenses').insert({
      project_id: form.project_id,
      date: form.date,
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description || null,
      receipt_url,
      receipt_name,
      created_by: user!.id,
    })

    if (error) { toast.error('新增失敗：' + error.message); setLoading(false); return }
    toast.success('開銷已記錄')
    setForm({ project_id: defaultProjectId ?? '', date: todayString(), category: 'material', amount: '', description: '' })
    setFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    router.refresh()
    setLoading(false)
    onSaved?.()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="w-4 h-4" />
          新增開銷
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!defaultProjectId && (
            <div className="space-y-1.5">
              <Label>工程</Label>
              <select name="project_id" value={form.project_id} onChange={handleChange} className={selectCls}>
                <option value="">選擇工程</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>日期</Label>
              <Input type="date" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="space-y-1.5">
              <Label>類別</Label>
              <select name="category" value={form.category} onChange={handleChange} className={selectCls}>
                <option value="material">材料</option>
                <option value="tool">工具</option>
                <option value="transportation">交通</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>金額（NT$）</Label>
            <Input type="number" name="amount" value={form.amount} onChange={handleChange} placeholder="0" min="0" step="1" />
          </div>
          <div className="space-y-1.5">
            <Label>說明</Label>
            <Textarea name="description" value={form.description} onChange={handleChange} placeholder="開銷說明" rows={2} />
          </div>

          {/* 發票上傳 */}
          <div className="space-y-1.5">
            <Label>發票 / 收據</Label>
            {file ? (
              <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="text-sm text-orange-700 flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="text-orange-400 hover:text-orange-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
              >
                <Upload className="w-4 h-4" />
                點擊上傳（照片、PDF）
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '新增中...' : '新增開銷'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
