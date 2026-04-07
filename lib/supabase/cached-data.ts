import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import type { KnowledgeTagGroup } from '@/types'

/**
 * unstable_cache persists across requests (unlike React cache which is per-render).
 * Perfect for semi-static data: categories, tags, active projects.
 * Revalidates every 5 minutes — admin changes take effect within 5 min.
 */

export const getCachedKnowledgeCategories = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('knowledge_categories')
      .select('id, name, color, points, sort_order')
      .order('sort_order')
    return data ?? []
  },
  ['knowledge-categories'],
  { revalidate: 300 }
)

export const getCachedTagGroups = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('knowledge_tag_groups')
      .select('id, label, sort_order, knowledge_tags(id, label, sort_order)')
      .order('sort_order')

    const groups: KnowledgeTagGroup[] = (data ?? []).map((g: any) => ({
      id: g.id,
      label: g.label,
      sort_order: g.sort_order,
      tags: (g.knowledge_tags ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }))
    return groups
  },
  ['knowledge-tag-groups'],
  { revalidate: 300 }
)

export const getCachedActiveProjects = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('projects')
      .select('id, name, address, status')
      .eq('status', 'active')
      .order('name')
    return data ?? []
  },
  ['active-projects'],
  { revalidate: 300 }
)

export const getCachedKnowledgeSettings = unstable_cache(
  async () => {
    const supabase = await createClient()
    const { data } = await supabase
      .from('knowledge_settings')
      .select('comment_points')
      .eq('id', 1)
      .single()
    return { commentPoints: data?.comment_points ?? 2 }
  },
  ['knowledge-settings'],
  { revalidate: 300 }
)
