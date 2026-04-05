import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from '@/components/system/CategoryManager'
import { KnowledgeCategoryManager } from '@/components/system/KnowledgeCategoryManager'
import { KnowledgeTagManager } from '@/components/system/KnowledgeTagManager'
import { UserManager } from '@/components/system/UserManager'
import { ProjectTabs } from '@/components/project/ProjectTabs'
import { Tag, Users } from 'lucide-react'
import type { KnowledgeTagGroup } from '@/types'

export default async function SystemPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: allCategories }, { data: profiles }, { data: knowledgeCategories }, { data: rawTagGroups }] = await Promise.all([
    supabase.from('expense_categories').select('id, name, sort_order, scope').order('sort_order'),
    supabase.from('profiles').select('id, full_name, role, allowed_sections').order('full_name'),
    supabase.from('knowledge_categories').select('id, name, color, points, sort_order').order('sort_order'),
    supabase.from('knowledge_tag_groups').select('id, label, sort_order, knowledge_tags(id, label, sort_order)').order('sort_order'),
  ])

  const tagGroups: KnowledgeTagGroup[] = (rawTagGroups ?? []).map(g => ({
    id: g.id,
    label: g.label,
    sort_order: g.sort_order,
    tags: ((g as any).knowledge_tags ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }))

  const expenseCategories = (allCategories ?? []).filter(c => c.scope === 'project')
  const companyExpenseCategories = (allCategories ?? []).filter(c => c.scope === 'company')

  const tabs = [
    { key: 'users', label: '用戶管理' },
    { key: 'categories', label: '分類管理' },
  ]

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系統管理</h1>
      </div>

      <ProjectTabs tabs={tabs}>
        {/* Tab 0: 用戶管理 */}
        <div>
          <UserManager
            profiles={profiles ?? []}
            currentUserId={user!.id}
          />
        </div>

        {/* Tab 1: 分類管理 */}
        <div className="space-y-6">
          <KnowledgeCategoryManager
            categories={knowledgeCategories ?? []}
          />
          <KnowledgeTagManager groups={tagGroups} />
          <CategoryManager
            title="工程開銷分類"
            tableName="expense_categories"
            categories={expenseCategories}
            icon={<Tag className="w-4 h-4" />}
            scope="project"
          />
          <CategoryManager
            title="公司開銷分類"
            tableName="expense_categories"
            categories={companyExpenseCategories}
            icon={<Tag className="w-4 h-4" />}
            scope="company"
          />
        </div>
      </ProjectTabs>
    </div>
  )
}
