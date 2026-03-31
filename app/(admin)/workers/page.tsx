import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, UserCog, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/date'

export default async function WorkersPage() {
  const supabase = await createClient()
  const { data: workers } = await supabase
    .from('workers')
    .select('*, profile:profiles(full_name, phone)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">師傅管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {workers?.length ?? 0} 位師傅</p>
        </div>
        <Link href="/workers/new">
          <Button><Plus className="w-4 h-4 mr-2" />新增師傅</Button>
        </Link>
      </div>

      {!workers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <UserCog className="w-10 h-10 mb-3 opacity-40" />
            <p>尚無師傅資料</p>
            <Link href="/workers/new" className="mt-3">
              <Button variant="outline" size="sm">新增第一位師傅</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker: any) => (
            <Link key={worker.id} href={`/workers/${worker.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{worker.profile?.full_name}</h3>
                    <Badge variant={worker.is_active ? 'default' : 'secondary'}>
                      {worker.is_active ? '在職' : '離職'}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {worker.profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        {worker.profile.phone}
                      </div>
                    )}
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
                      <span>時薪：<span className="font-medium text-gray-900">{formatCurrency(worker.hourly_rate)}</span></span>
                      <span>加班：<span className="font-medium text-gray-900">{formatCurrency(worker.overtime_rate)}</span></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
