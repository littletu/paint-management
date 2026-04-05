'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Lightbulb, ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { KnowledgeCategory } from '@/types'
import { KNOWLEDGE_CATEGORY_LABELS } from '@/types'
import { compressImage } from '@/lib/utils/compress-image'

interface Project { id: string; name: string }
interface Props { workerId: string; projects: Project[] }

const CATEGORIES = Object.entries(KNOWLEDGE_CATEGORY_LABELS) as [KnowledgeCategory, string][]

export function KnowledgeTipForm({ workerId, projects }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: '',
    content: '',
    reason: '',
    category: 'general' as KnowledgeCategory,
    project_id: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('請填寫標題'); return }
    if (!form.content.trim()) { toast.error('請填寫內容'); return }
    if (!workerId) { toast.error('找不到師傅資料'); return }

    setLoading(true)

    // Upload image if attached
    let image_url: string | null = null
    if (imageFile) {
      const compressed = await compressImage(imageFile)
      const { data: { user } } = await supabase.auth.getUser()
      const ext = compressed.name.split('.').pop()
      const path = `knowledge/${user!.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, compressed, { upsert: false })
      if (uploadError) {
        toast.error('圖片上傳失敗：' + uploadError.message)
        setLoading(false)
        return
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      image_url = urlData.publicUrl
    }

    const { error } = await supabase.from('knowledge_tips').insert({
      worker_id: workerId,
      project_id: form.project_id || null,
      title: form.title.trim(),
      content: form.content.trim(),
      reason: form.reason.trim() || null,
      category: form.category,
      image_url,
    })

    if (error) { toast.error('送出失敗：' + error.message); setLoading(false); return }

    toast.success('老塞分享成功！感謝師傅的智慧傳承 🎉')
    setForm({ title: '', content: '', reason: '', category: 'general', project_id: '' })
    removeImage()
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardContent className="pt-0 pb-0">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between py-4 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-orange-700">
            <Lightbulb className="w-4 h-4" />
            分享一個老塞
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-orange-400" />
            : <ChevronDown className="w-4 h-4 text-orange-400" />
          }
        </button>

        {open && (
          <form onSubmit={handleSubmit} className="space-y-3 pb-4">
            {/* 標題 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">碰到的問題或技巧 *</label>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="例：外牆噴塗前一定要做的事"
                className="text-sm bg-white"
              />
            </div>

            {/* 內容 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">你的做法或建議 *</label>
              <Textarea
                name="content"
                value={form.content}
                onChange={handleChange}
                placeholder={"範例\n磁磚面一定要先打磨，讓表面粗糙才能附著。底漆用環氧樹脂的，不能用水性底漆，附著力差幾個月就起皮。打磨完要擦乾淨，兩道底漆比一道好，第一道薄、第二道稍厚。"}
                rows={4}
                className="text-sm bg-white resize-none"
              />
            </div>

            {/* 原因 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">為什麼要這樣做？</label>
              <Textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                placeholder="例：因為磁磚太光滑，普通底漆咬不住"
                rows={2}
                className="text-sm bg-white resize-none"
              />
            </div>

            {/* 分類 + 工程 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">分類</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={cn(
                    'w-full h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none',
                    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                  )}
                >
                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">相關工程（選填）</label>
                <select
                  name="project_id"
                  value={form.project_id}
                  onChange={handleChange}
                  className={cn(
                    'w-full h-8 rounded-lg border border-input bg-white px-2.5 text-sm outline-none',
                    'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
                    !form.project_id && 'text-muted-foreground'
                  )}
                >
                  <option value="">不指定</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 圖片上傳 */}
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">附上照片（選填）</label>
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="預覽" className="w-full max-h-48 object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 h-20 rounded-lg border-2 border-dashed border-gray-200 bg-white text-gray-400 hover:border-orange-300 hover:text-orange-400 transition-colors text-sm"
                >
                  <ImagePlus className="w-5 h-5" />
                  點擊上傳照片
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '送出中...' : '送出老塞'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
