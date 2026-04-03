import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, UserCog, Phone } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/date'
import Image from 'next/image'

export default async function WorkersPage() {
  const supabase = await createClient()
  const { data: workers } = await supabase
    .from('workers')
    .select('*, profile:profiles(full_name, phone, avatar_url)')
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
                    <div className="flex items-center gap-3">
                      {worker.profile?.avatar_url ? (
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                          <Image src={worker.profile.avatar_url} alt={worker.profile.full_name} fill className="object-cover" unoptimized />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
                          {worker.profile?.full_name?.[0] ?? '?'}
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900">{worker.profile?.full_name}</h3>
                    </div>
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
                      <span>日薪：<span className="font-medium text-gray-900">{formatCurrency(worker.daily_rate)}</span></span>
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
