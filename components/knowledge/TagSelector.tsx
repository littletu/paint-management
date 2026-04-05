'use client'

import { cn } from '@/lib/utils'
import { KNOWLEDGE_TAG_GROUPS } from '@/types'

interface Props {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ selected, onChange }: Props) {
  function toggle(tag: string) {
    onChange(
      selected.includes(tag)
        ? selected.filter(t => t !== tag)
        : [...selected, tag]
    )
  }

  return (
    <div className="space-y-2.5">
      {KNOWLEDGE_TAG_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.tags.map(tag => {
              const active = selected.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    active
                      ? 'bg-orange-500 border-orange-500 text-white font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                  )}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
