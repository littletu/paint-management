'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  projectId: string
  initialName: string
}

export function ProjectNameEditor({ projectId, initialName }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) { toast.error('工程名稱不可為空'); return }
    if (trimmed === initialName) { setEditing(false); return }

    setSaving(true)
    const { error } = await supabase.from('projects').update({ name: trimmed }).eq('id', projectId)
    setSaving(false)

    if (error) { toast.error('更新失敗：' + error.message); return }
    toast.success('工程名稱已更新')
    setEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setName(initialName)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') handleCancel()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="text-2xl font-bold text-gray-900 border-b-2 border-orange-400 bg-transparent outline-none w-full max-w-md"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-1.5 text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
          title="儲存"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          className="p-1.5 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg"
          title="取消"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold text-gray-900">{initialName}</h1>
      <button
        onClick={() => setEditing(true)}
        className="p-1.5 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-gray-100"
        title="編輯工程名稱"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  )
}
