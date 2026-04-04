import { createClient } from '@/lib/supabase/server'
import { CategoryManager } from '@/components/system/CategoryManager'
import { Tag } from 'lucide-react'

export default async function SystemPage() {
  const supabase = await createClient()

  const { data: allCategories } = await supabase
    .from('expense_categories')
    .select('id, name, sort_order, scope')
    .order('sort_order')

  const expenseCategories = (allCategories ?? []).filter(c => c.scope === 'project')
  const companyExpenseCategories = (allCategories ?? []).filter(c => c.scope === 'company')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系統管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理開銷分類設定</p>
      </div>

      <div className="space-y-6">
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
    </div>
  )
}
