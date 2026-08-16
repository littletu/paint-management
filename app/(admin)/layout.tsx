import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/cached-auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // getClaims 本地驗證 JWT，免去每頁一次 Auth server 網路請求
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, allowed_sections')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/worker/work-log')

  return (
    <div className="flex h-full">
      <AdminSidebar allowedSections={profile?.allowed_sections ?? null} />
      <main className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
