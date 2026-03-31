import { createClient } from '@/lib/supabase/server'
import { ProjectForm } from '@/components/forms/ProjectForm'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('name')

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新增工程</h1>
      </div>
      <ProjectForm customers={customers ?? []} />
    </div>
  )
}
