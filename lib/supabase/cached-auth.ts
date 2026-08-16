import { cache } from 'react'
import { createClient } from './server'

/**
 * React cache() deduplicates calls within the same server render pass.
 * Layout and page both calling getAuthUser() → only ONE verification.
 * getClaims() 以本地 WebCrypto 驗證 JWT（非對稱金鑰時免打 Auth server）。
 */
export const getAuthUser = cache(async (): Promise<{ id: string; email: string | null } | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null }
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

/** Cached profile allowed_sections — shared by issues + leaderboard pages */
export const getWorkerProfile = cache(async (profileId: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('allowed_sections')
    .eq('id', profileId)
    .single()
  return data
})

/** Cached knowledge settings — avoids repeated fetches across multiple pages */
export const getKnowledgeSettings = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('knowledge_settings')
    .select('comment_points')
    .eq('id', 1)
    .single()
  return { commentPoints: data?.comment_points ?? 2 }
})
