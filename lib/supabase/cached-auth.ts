import { cache } from 'react'
import { createClient } from './server'

/**
 * React cache() deduplicates calls within the same server render pass.
 * Layout and page both calling getAuthUser() → only ONE network round trip.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getWorkerIdByProfileId = cache(async (profileId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workers')
    .select('id')
    .eq('profile_id', profileId)
    .single()
  return data?.id ?? null
})
