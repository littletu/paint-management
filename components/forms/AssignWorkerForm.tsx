'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

interface Props {
  projectId: string
  workers: Array<{ id: string; profile: { full_name: string } }>
}

export function AssignWorkerForm({ projectId, workers }: Props) {
  const [workerId, setWorkerId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleAssign() {
    if (!workerId) { toast.error('請選擇師傅'); return }
    setLoading(true)
    const { error } = await supabase.from('project_workers').insert({
      project_id: projectId,
      worker_id: workerId,
    })
    if (error) { toast.error('指派失敗：' + error.message); setLoading(false); return }
    toast.success('師傅已指派')
    setWorkerId('')
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex gap-2 mt-2">
      <Select value={workerId} onValueChange={(v) => setWorkerId(v ?? '')}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="選擇師傅加入工程" />
        </SelectTrigger>
        <SelectContent>
          {workers.map(w => (
            <SelectItem key={w.id} value={w.id}>{(w.profile as any)?.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleAssign} disabled={loading || !workerId} size="sm">
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        指派
      </Button>
    </div>
  )
}
