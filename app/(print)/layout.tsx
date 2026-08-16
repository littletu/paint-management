import { getAuthUser } from '@/lib/supabase/cached-auth'
import { redirect } from 'next/navigation'

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')
  return <>{children}</>
}
