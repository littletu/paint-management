'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectForm } from '@/components/forms/ProjectForm'
import { formatCurrency, formatDate } from '@/lib/utils/date'
import { Pencil } from 'lucide-react'
import type { Project, Customer } from '@/types'

const statusLabel: Record<string, string> = {
  pending: '待開工',
  active: '進行中',
  completed: '已完工',
  cancelled: '已取消',
}

interface Props {
  project: Project
  customers: Customer[]
}

export function ProjectInfoPanel({ project, customers }: Props) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
            取消
          </Button>
        </div>
        <ProjectForm project={project} customers={customers} onSaved={() => setEditing(false)} />
      </div>
    )
  }

  const fields = [
    { label: '客戶', value: (project as any).customer?.name ?? '—' },
    { label: '狀態', value: statusLabel[project.status] ?? project.status },
    { label: '合約金額', value: project.contract_amount ? formatCurrency(project.contract_amount) : '—' },
    { label: '開始日期', value: project.start_date ? formatDate(project.start_date) : '—' },
    { label: '結束日期', value: project.end_date ? formatDate(project.end_date) : '—' },
    { label: '施工地址', value: project.address || '—' },
  ]

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">工程資訊</h3>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            編輯
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {fields.map(f => (
            <div key={f.label}>
              <p className="text-xs text-gray-400 mb-0.5">{f.label}</p>
              <p className="text-sm font-medium text-gray-900">{f.value}</p>
            </div>
          ))}
        </div>
        {project.description && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-1">工程說明</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
