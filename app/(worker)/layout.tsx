import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/supabase/cached-auth'
import { redirect } from 'next/navigation'
import { WorkerHeader } from '@/components/layout/WorkerHeader'
import { WorkerNav } from '@/components/layout/WorkerNav'

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  // React cache() deduplicates this call — pages calling getAuthUser() share the same result
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      <WorkerHeader fullName={profile?.full_name ?? ''} />

      {/* Content */}
      <main className="flex-1 px-4 py-4 pb-24 max-w-lg mx-auto w-full">
        {children}
      </main>

      <WorkerNav />
    </div>
  )
}
