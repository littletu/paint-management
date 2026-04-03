import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { WorkerForm } from '@/components/forms/WorkerForm'
import { WorkerDeleteButton } from '@/components/forms/WorkerDeleteButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Clock, User } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import Image from 'next/image'

const genderLabel: Record<string, string> = { male: '男', female: '女' }

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: worker } = await supabase
    .from('workers')
    .select('*, profile:profiles(*)')
    .eq('id', id)
    .single()

  if (!worker) notFound()

  const profile = worker.profile as any

  // Recent time entries
  const { data: recentEntries } = await supabase
    .from('time_entries')
    .select('*, project:projects(name)')
    .eq('worker_id', id)
    .order('work_date', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/workers" className="text-gray-500 hover:text-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          {profile?.avatar_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
              <Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
              {profile?.full_name?.[0] ?? '?'}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h1>
        </div>
        <WorkerDeleteButton workerId={id} workerName={profile?.full_name ?? ''} />
      </div>

      <div className="space-y-6">
        <WorkerForm worker={worker as any} />

        {/* 完整個人資料 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              個人資料詳細
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-50">
              <InfoRow label="手機" value={profile?.mobile} />
              <InfoRow label="身分證字號" value={profile?.id_number} />
              <InfoRow label="生日" value={profile?.birthday ? formatDate(profile.birthday) : null} />
              <InfoRow label="性別" value={profile?.gender ? genderLabel[profile.gender] : null} />
              <InfoRow label="血型" value={profile?.blood_type ? `${profile.blood_type} 型` : null} />
              <InfoRow label="地址" value={profile?.address} />
              <InfoRow label="緊急聯絡人" value={profile?.emergency_contact} />
              <InfoRow label="緊急聯絡人電話" value={profile?.emergency_phone} />
            </div>
            {!profile?.mobile && !profile?.id_number && !profile?.birthday && !profile?.address && (
              <p className="text-sm text-gray-400 text-center py-3">尚未填寫個人詳細資料</p>
            )}
          </CardContent>
        </Card>

        {/* 近期工時記錄 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              近期工時記錄
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentEntries?.length ? (
              <p className="text-sm text-gray-500 text-center py-4">尚無工時記錄</p>
            ) : (
              <div className="space-y-2">
                {recentEntries.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{formatDate(entry.work_date)}</p>
                      <p className="text-gray-500 text-xs">{(entry.project as any)?.name}</p>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <p>正常 {entry.regular_hours}h ／ 加班 {entry.overtime_hours}h</p>
                      <p className="text-gray-500">
                        {formatCurrency(
                          (entry.transportation_fee || 0) +
                          (entry.meal_fee || 0) +
                          (entry.advance_payment || 0) +
                          (entry.subsidy || 0) +
                          (entry.other_fee || 0)
                        )} 費用
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
