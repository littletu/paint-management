'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  workers: Array<{ id: string; profile: any }>
  projects: Array<{ id: string; name: string }>
  currentFilters: {
    worker_id?: string
    project_id?: string
    date_from?: string
    date_to?: string
  }
}

export function TimeReportFilters({ workers, projects, currentFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [filters, setFilters] = useState({
    worker_id: currentFilters.worker_id ?? 'all',
    project_id: currentFilters.project_id ?? 'all',
    date_from: currentFilters.date_from ?? '',
    date_to: currentFilters.date_to ?? '',
  })

  function handleSearch() {
    const params = new URLSearchParams()
    if (filters.worker_id && filters.worker_id !== 'all') params.set('worker_id', filters.worker_id)
    if (filters.project_id && filters.project_id !== 'all') params.set('project_id', filters.project_id)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    router.push(pathname + (params.toString() ? '?' + params.toString() : ''))
  }

  function handleReset() {
    setFilters({ worker_id: 'all', project_id: 'all', date_from: '', date_to: '' })
    router.push(pathname)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1">
          <Label className="text-xs">師傅</Label>
          <Select value={filters.worker_id} onValueChange={v => setFilters(p => ({ ...p, worker_id: v ?? 'all' }))}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="全部師傅" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部師傅</SelectItem>
              {workers.map(w => (
                <SelectItem key={w.id} value={w.id} label={w.profile?.full_name ?? ''}>{w.profile?.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">工程</Label>
          <Select value={filters.project_id} onValueChange={v => setFilters(p => ({ ...p, project_id: v ?? 'all' }))}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="全部工程" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部工程</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id} label={p.name}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">起始日期</Label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={filters.date_from}
            onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">結束日期</Label>
          <Input
            type="date"
            className="h-9 text-sm"
            value={filters.date_to}
            onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={handleSearch}>
          <Search className="w-3.5 h-3.5 mr-1.5" />
          搜尋
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          <X className="w-3.5 h-3.5 mr-1.5" />
          重置
        </Button>
      </div>
    </div>
  )
}
