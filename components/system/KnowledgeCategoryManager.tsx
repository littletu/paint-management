'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical, Pencil, Check, X, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { KnowledgeDBCategory } from '@/types'
import { KNOWLEDGE_COLOR_CLASSES, KNOWLEDGE_COLOR_HEX } from '@/types'

const COLOR_KEYS = Object.keys(KNOWLEDGE_COLOR_HEX)

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {COLOR_KEYS.map(key => (
        <button
          key={key}
          type="button"
          title={key}
          onClick={() => onChange(key)}
          className={cn(
            'w-5 h-5 rounded-full border-2 transition-transform',
            value === key ? 'border-gray-800 scale-125' : 'border-transparent hover:scale-110'
          )}
          style={{ backgroundColor: KNOWLEDGE_COLOR_HEX[key] }}
        />
      ))}
    </div>
  )
}

interface Props {
  categories: KnowledgeDBCategory[]
}

export function KnowledgeCategoryManager({ categories: init }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [categories, setCategories] = useState(init)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('gray')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('gray')

  // Drag-to-reorder
  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function handleDragStart(idx: number) { dragIndex.current = idx }
  function handleDragLeave() { setDragOverIndex(null) }
  function handleDragEnd() { dragIndex.current = null; setDragOverIndex(null) }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOverIndex(idx)
  }

  async function handleDrop(dropIdx: number) {
    setDragOverIndex(null)
    const fromIdx = dragIndex.current
    if (fromIdx === null || fromIdx === dropIdx) return
    dragIndex.current = null
    const reordered = [...categories]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(dropIdx, 0, moved)
    const updated = reordered.map((c, i) => ({ ...c, sort_order: i + 1 }))
    setCategories(updated)
    const results = await Promise.all(
      updated.map(c => supabase.from('knowledge_categories').update({ sort_order: c.sort_order }).eq('id', c.id))
    )
    const failed = results.find(r => r.error)
    if (failed?.error) { toast.error('排序更新失敗：' + failed.error.message) }
    else { router.refresh() }
  }

  async function handleAdd() {
    if (!newName.trim()) return
    const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), 0)
    const { data, error } = await supabase
      .from('knowledge_categories')
      .insert({ name: newName.trim(), color: newColor, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (error) { toast.error('新增失敗：' + error.message); return }
    setCategories(prev => [...prev, data as KnowledgeDBCategory])
    setNewName('')
    setNewColor('gray')
    setAdding(false)
    toast.success('已新增')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個分類？已使用此分類的老塞將顯示為無分類。')) return
    const { error } = await supabase.from('knowledge_categories').delete().eq('id', id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setCategories(prev => prev.filter(c => c.id !== id))
    toast.success('已刪除')
    router.refresh()
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return
    const { error } = await supabase
      .from('knowledge_categories')
      .update({ name: editName.trim(), color: editColor })
      .eq('id', id)
    if (error) { toast.error('更新失敗：' + error.message); return }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim(), color: editColor } : c))
    setEditingId(null)
    toast.success('已更新')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-orange-500" />
          妙根老塞分類
          <span className="text-xs font-normal text-gray-400 ml-1">{categories.length} 項</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {categories.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">尚無分類，請新增</p>
        )}

        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={cn(
              'flex items-center gap-2 p-2.5 rounded-lg group transition-colors',
              dragOverIndex === idx
                ? 'bg-orange-50 border-2 border-orange-300 border-dashed'
                : 'bg-gray-50 border-2 border-transparent'
            )}
          >
            <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />

            {editingId === cat.id ? (
              <div className="flex-1 space-y-2">
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(cat.id); if (e.key === 'Escape') setEditingId(null) }}
                  className="h-7 text-sm"
                  autoFocus
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <div className="flex gap-1.5">
                  <button onClick={() => handleEdit(cat.id)} className="text-green-500 hover:text-green-700 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span
                  className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', KNOWLEDGE_COLOR_CLASSES[cat.color] ?? 'bg-gray-100 text-gray-600')}
                >
                  {cat.name}
                </span>
                <span className="flex-1" />
                <button
                  onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color) }}
                  className="text-gray-300 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div className="space-y-2 pt-1 border border-dashed border-orange-200 rounded-lg p-3 bg-orange-50/30">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="輸入分類名稱"
              className="h-8 text-sm bg-white"
              autoFocus
            />
            <div>
              <p className="text-xs text-gray-500 mb-1.5">選擇顏色</p>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="h-8 shrink-0">新增</Button>
              <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewName(''); setNewColor('gray') }} className="h-8 shrink-0">取消</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 w-full py-2 text-sm text-orange-600 hover:text-orange-700 border border-dashed border-orange-200 hover:border-orange-300 rounded-lg justify-center transition-colors mt-1"
          >
            <Plus className="w-4 h-4" />
            新增分類
          </button>
        )}
      </CardContent>
    </Card>
  )
}
