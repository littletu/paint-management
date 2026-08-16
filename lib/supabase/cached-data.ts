import { cache } from 'react'
import { createClient } from './server'
import type { KnowledgeTagGroup } from '@/types'

/**
 * React cache() deduplicates within the same server render pass.
 * Safe to use with Supabase server client (cookie-based auth context is preserved).
 */

export const getCachedKnowledgeCategories = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('knowledge_categories')
    .select('id, name, color, points, sort_order')
    .order('sort_order')
  return data ?? []
})

export const getCachedTagGroups = cache(async () => {
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
})

export const getCachedActiveProjects = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, name, address, status')
    .eq('status', 'active')
    .order('name')
  return data ?? []
})

/** 師傅薪率表（小表，一次抓齊）— 供財務計算用，避免在 time_entries 上逐列 join */
export const getCachedWorkerRates = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('workers')
    .select('id, daily_rate, overtime_rate')
  return new Map<string, { daily_rate: number; overtime_rate: number }>(
    (data ?? []).map((w: any) => [w.id, { daily_rate: w.daily_rate ?? 0, overtime_rate: w.overtime_rate ?? 0 }])
  )
})

export const getCachedKnowledgeSettings = cache(async () => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('knowledge_settings')
    .select('comment_points, question_points, reply_points')
    .eq('id', 1)
    .single()
  return {
    commentPoints:  data?.comment_points  ?? 2,
    questionPoints: (data as any)?.question_points ?? 3,
    replyPoints:    (data as any)?.reply_points    ?? 2,
  }
})
