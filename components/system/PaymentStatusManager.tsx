'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical, Pencil, Check, X, Banknote } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { KNOWLEDGE_COLOR_CLASSES, KNOWLEDGE_COLOR_HEX } from '@/types'

export interface PaymentStatus {
  id: string
  label: string
  color: string
  sort_order: number
}

const COLOR_OPTIONS = ['gray', 'blue', 'orange', 'purple', 'green', 'red', 'yellow', 'pink']

interface Props {
  statuses: PaymentStatus[]
}

export function PaymentStatusManager({ statuses: init }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [statuses, setStatuses] = useState(init)
  const [newLabel, setNewLabel] = useState('')
  const [newColor, setNewColor] = useState('gray')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState('gray')

  const dragIndex = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  function handleDragStart(idx: number) { dragIndex.current = idx }
  function handleDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIndex(idx) }
  function handleDragLeave() { setDragOverIndex(null) }
  function handleDragEnd() { dragIndex.current = null; setDragOverIndex(null) }

  async function handleDrop(dropIdx: number) {
    setDragOverIndex(null)
    const fromIdx = dragIndex.current
    if (fromIdx === null || fromIdx === dropIdx) return
    dragIndex.current = null
    const reordered = [...statuses]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(dropIdx, 0, moved)
    const updated = reordered.map((s, i) => ({ ...s, sort_order: i + 1 }))
    setStatuses(updated)
    const results = await Promise.all(
      updated.map(s => supabase.from('payment_statuses').update({ sort_order: s.sort_order }).eq('id', s.id))
    )
    const failed = results.find(r => r.error)
    if (failed?.error) toast.error('排序更新失敗：' + failed.error.message)
    else router.refresh()
  }

  async function handleAdd() {
    if (!newLabel.trim()) return
    const maxOrder = statuses.reduce((m, s) => Math.max(m, s.sort_order), 0)
    const { data, error } = await supabase
      .from('payment_statuses')
      .insert({ label: newLabel.trim(), color: newColor, sort_order: maxOrder + 1 })
      .select()
      .single()
    if (error) { toast.error('新增失敗：' + error.message); return }
    setStatuses(prev => [...prev, data])
    setNewLabel(''); setNewColor('gray'); setAdding(false)
    toast.success('已新增')
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個款項狀態？')) return
    const { error } = await supabase.from('payment_statuses').delete().eq('id', id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setStatuses(prev => prev.filter(s => s.id !== id))
    toast.success('已刪除')
    router.refresh()
  }

  async function handleEdit(id: string) {
    if (!editLabel.trim()) return
    const { error } = await supabase
      .from('payment_statuses')
      .update({ label: editLabel.trim(), color: editColor })
      .eq('id', id)
    if (error) { toast.error('更新失敗：' + error.message); return }
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, label: editLabel.trim(), color: editColor } : s))
    setEditingId(null)
    toast.success('已更新')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          款項狀態
          <span className="text-xs font-normal text-gray-400 ml-1">{statuses.length} 項</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {statuses.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">尚無狀態，請新增</p>
        )}

        {statuses.map((s, idx) => (
          <div
            key={s.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(idx)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 p-2.5 rounded-lg group transition-colors ${
              dragOverIndex === idx
                ? 'bg-orange-50 border-2 border-orange-300 border-dashed'
                : 'bg-gray-50 border-2 border-transparent'
            }`}
          >
            <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" />
            {editingId === s.id ? (
              <>
                <Input
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(s.id); if (e.key === 'Escape') setEditingId(null) }}
                  className="h-7 text-sm flex-1"
                  autoFocus
                />
                <div className="flex gap-1">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${editColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: KNOWLEDGE_COLOR_HEX[c] }}
                    />
                  ))}
                </div>
                <button onClick={() => handleEdit(s.id)} className="text-green-500 hover:text-green-700 p-1">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${KNOWLEDGE_COLOR_CLASSES[s.color] ?? 'bg-gray-100 text-gray-600'}`}>
                  {s.label}
                </span>
                <span className="flex-1" />
                <button
                  onClick={() => { setEditingId(s.id); setEditLabel(s.label); setEditColor(s.color) }}
                  className="text-gray-300 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div className="space-y-2 pt-1">
            <Input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
              placeholder="輸入狀態名稱"
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">顏色：</span>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${newColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: KNOWLEDGE_COLOR_HEX[c] }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="h-8">新增</Button>
              <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewLabel(''); setNewColor('gray') }} className="h-8">取消</Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 w-full py-2 text-sm text-orange-600 hover:text-orange-700 border border-dashed border-orange-200 hover:border-orange-300 rounded-lg justify-center transition-colors mt-1"
          >
            <Plus className="w-4 h-4" />
            新增狀態
          </button>
        )}
      </CardContent>
    </Card>
  )
}
