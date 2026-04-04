'use client'

import { useState } from 'react'

interface TabDef {
  key: string
  label: string
  count?: number
}

interface Props {
  tabs: TabDef[]
  children: React.ReactNode[]
}

export function ProjectTabs({ tabs, children }: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const childrenArr = Array.isArray(children) ? children : [children]

  return (
    <div>
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab, idx) => (
          <button
            key={tab.key}
            onClick={() => setActiveIdx(idx)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeIdx === idx
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeIdx === idx ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {childrenArr.map((child, idx) => (
        <div key={idx} className={activeIdx === idx ? 'block' : 'hidden'}>
          {child}
        </div>
      ))}
    </div>
  )
}
