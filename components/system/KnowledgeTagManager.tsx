'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2, Pencil, Check, X, Tag } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { KnowledgeTagGroup } from '@/types'

interface Props {
  groups: KnowledgeTagGroup[]
}

export function KnowledgeTagManager({ groups: init }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [groups, setGroups] = useState(init)

  // Group-level state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editGroupLabel, setEditGroupLabel] = useState('')
  const [addingGroup, setAddingGroup] = useState(false)
  const [newGroupLabel, setNewGroupLabel] = useState('')

  // Tag-level state (keyed by groupId)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [editTagLabel, setEditTagLabel] = useState('')
  const [addingTagGroupId, setAddingTagGroupId] = useState<string | null>(null)
  const [newTagLabel, setNewTagLabel] = useState('')

  // ── Group operations ──

  async function handleAddGroup() {
    if (!newGroupLabel.trim()) return
    const maxOrder = groups.reduce((m, g) => Math.max(m, g.sort_order), 0)
    const { data, error } = await supabase
      .from('knowledge_tag_groups')
      .insert({ label: newGroupLabel.trim(), sort_order: maxOrder + 1 })
      .select('id, label, sort_order')
      .single()
    if (error) { toast.error('新增失敗：' + error.message); return }
    setGroups(prev => [...prev, { ...data, tags: [] }])
    setNewGroupLabel('')
    setAddingGroup(false)
    toast.success('已新增分組')
    router.refresh()
  }

  async function handleEditGroup(id: string) {
    if (!editGroupLabel.trim()) return
    const { error } = await supabase
      .from('knowledge_tag_groups')
      .update({ label: editGroupLabel.trim() })
      .eq('id', id)
    if (error) { toast.error('更新失敗：' + error.message); return }
    setGroups(prev => prev.map(g => g.id === id ? { ...g, label: editGroupLabel.trim() } : g))
    setEditingGroupId(null)
    toast.success('已更新')
    router.refresh()
  }

  async function handleDeleteGroup(id: string) {
    const group = groups.find(g => g.id === id)
    if (group && group.tags.length > 0) {
      if (!confirm(`「${group.label}」還有 ${group.tags.length} 個標籤，刪除後一併移除，確定？`)) return
    } else {
      if (!confirm('確定刪除這個分組？')) return
    }
    const { error } = await supabase.from('knowledge_tag_groups').delete().eq('id', id)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setGroups(prev => prev.filter(g => g.id !== id))
    toast.success('已刪除')
    router.refresh()
  }

  // ── Tag operations ──

  async function handleAddTag(groupId: string) {
    if (!newTagLabel.trim()) return
    const group = groups.find(g => g.id === groupId)!
    const maxOrder = group.tags.reduce((m, t) => Math.max(m, t.sort_order), 0)
    const { data, error } = await supabase
      .from('knowledge_tags')
      .insert({ group_id: groupId, label: newTagLabel.trim(), sort_order: maxOrder + 1 })
      .select('id, label, sort_order')
      .single()
    if (error) { toast.error('新增失敗：' + error.message); return }
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, tags: [...g.tags, data] } : g
    ))
    setNewTagLabel('')
    setAddingTagGroupId(null)
    toast.success('已新增標籤')
    router.refresh()
  }

  async function handleEditTag(tagId: string, groupId: string) {
    if (!editTagLabel.trim()) return
    const { error } = await supabase
      .from('knowledge_tags')
      .update({ label: editTagLabel.trim() })
      .eq('id', tagId)
    if (error) { toast.error('更新失敗：' + error.message); return }
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? { ...g, tags: g.tags.map(t => t.id === tagId ? { ...t, label: editTagLabel.trim() } : t) }
        : g
    ))
    setEditingTagId(null)
    toast.success('已更新')
    router.refresh()
  }

  async function handleDeleteTag(tagId: string, groupId: string) {
    if (!confirm('確定刪除這個標籤？')) return
    const { error } = await supabase.from('knowledge_tags').delete().eq('id', tagId)
    if (error) { toast.error('刪除失敗：' + error.message); return }
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, tags: g.tags.filter(t => t.id !== tagId) } : g
    ))
    toast.success('已刪除')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-500" />
          老塞標籤管理
          <span className="text-xs font-normal text-gray-400 ml-1">
            {groups.length} 組 · {groups.reduce((s, g) => s + g.tags.length, 0)} 個標籤
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Groups */}
        {groups.map(group => (
          <div key={group.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
            {/* Group header */}
            <div className="flex items-center gap-2">
              {editingGroupId === group.id ? (
                <>
                  <Input
                    value={editGroupLabel}
                    onChange={e => setEditGroupLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEditGroup(group.id); if (e.key === 'Escape') setEditingGroupId(null) }}
                    className="h-7 text-sm flex-1"
                    autoFocus
                  />
                  <button onClick={() => handleEditGroup(group.id)} className="text-green-500 hover:text-green-700 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingGroupId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <p className="text-xs font-bold text-gray-600 flex-1">{group.label}</p>
                  <button
                    onClick={() => { setEditingGroupId(group.id); setEditGroupLabel(group.label) }}
                    className="text-gray-300 hover:text-gray-600 p-1"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="text-gray-300 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {group.tags.map(tag => (
                <div key={tag.id} className="flex items-center gap-0.5">
                  {editingTagId === tag.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editTagLabel}
                        onChange={e => setEditTagLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditTag(tag.id, group.id); if (e.key === 'Escape') setEditingTagId(null) }}
                        className="h-6 text-xs w-24"
                        autoFocus
                      />
                      <button onClick={() => handleEditTag(tag.id, group.id)} className="text-green-500 hover:text-green-700">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingTagId(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="group/tag flex items-center gap-0.5 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {tag.label}
                      <button
                        onClick={() => { setEditingTagId(tag.id); setEditTagLabel(tag.label) }}
                        className="text-gray-300 hover:text-gray-600 opacity-0 group-hover/tag:opacity-100 transition-opacity ml-0.5"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id, group.id)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                </div>
              ))}

              {/* Add tag inline */}
              {addingTagGroupId === group.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newTagLabel}
                    onChange={e => setNewTagLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddTag(group.id); if (e.key === 'Escape') { setAddingTagGroupId(null); setNewTagLabel('') } }}
                    placeholder="標籤名稱"
                    className="h-6 text-xs w-24"
                    autoFocus
                  />
                  <button onClick={() => handleAddTag(group.id)} className="text-green-500 hover:text-green-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setAddingTagGroupId(null); setNewTagLabel('') }} className="text-gray-400 hover:text-gray-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setAddingTagGroupId(group.id); setNewTagLabel('') }}
                  className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-0.5 px-2 py-0.5 rounded-full border border-dashed border-orange-200 hover:border-orange-300 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  新增
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add group */}
        {addingGroup ? (
          <div className="flex items-center gap-2 border border-dashed border-orange-200 rounded-xl p-3">
            <Input
              value={newGroupLabel}
              onChange={e => setNewGroupLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddGroup(); if (e.key === 'Escape') setAddingGroup(false) }}
              placeholder="分組名稱"
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleAddGroup} className="h-8 shrink-0">新增</Button>
            <Button size="sm" variant="outline" onClick={() => { setAddingGroup(false); setNewGroupLabel('') }} className="h-8 shrink-0">取消</Button>
          </div>
        ) : (
          <button
            onClick={() => setAddingGroup(true)}
            className="flex items-center gap-1.5 w-full py-2 text-sm text-orange-600 hover:text-orange-700 border border-dashed border-orange-200 hover:border-orange-300 rounded-lg justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增分組
          </button>
        )}
      </CardContent>
    </Card>
  )
}
