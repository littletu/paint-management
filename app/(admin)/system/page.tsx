import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from '@/components/system/CategoryManager'
import { Tag, FolderOpen } from 'lucide-react'

export default async function SystemPage() {
  const supabase = await createClient()

  const [{ data: expenseCategories }, { data: projectCategories }] = await Promise.all([
    supabase.from('expense_categories').select('id, name, sort_order').order('sort_order'),
    supabase.from('project_categories').select('id, name, sort_order').order('sort_order'),
  ])

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系統管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理開銷分類與工程分類</p>
      </div>

      <div className="space-y-6">
        <CategoryManager
          title="開銷分類"
          tableName="expense_categories"
          categories={expenseCategories ?? []}
          icon={<Tag className="w-4 h-4" />}
        />

        <CategoryManager
          title="工程分類"
          tableName="project_categories"
          categories={projectCategories ?? []}
          icon={<FolderOpen className="w-4 h-4" />}
        />
      </div>
    </div>
  )
}
