'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
      <select
        value={workerId}
        onChange={e => setWorkerId(e.target.value)}
        className="flex-1 h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">選擇師傅加入工程</option>
        {workers.map(w => (
          <option key={w.id} value={w.id}>{(w.profile as any)?.full_name}</option>
        ))}
      </select>
      <Button onClick={handleAssign} disabled={loading || !workerId} size="sm">
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        指派
      </Button>
    </div>
  )
}
