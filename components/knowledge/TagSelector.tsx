'use client'

import { cn } from '@/lib/utils'
import type { KnowledgeTagGroup } from '@/types'

interface Props {
  groups: KnowledgeTagGroup[]
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ groups, selected, onChange }: Props) {
  function toggle(label: string) {
    onChange(
      selected.includes(label)
        ? selected.filter(t => t !== label)
        : [...selected, label]
    )
  }

  if (!groups.length) return null

  return (
    <div className="space-y-2.5">
      {groups.map(group => (
        <div key={group.id}>
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.tags.map(tag => {
              const active = selected.includes(tag.label)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.label)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    active
                      ? 'bg-orange-500 border-orange-500 text-white font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                  )}
                >
                  {tag.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
