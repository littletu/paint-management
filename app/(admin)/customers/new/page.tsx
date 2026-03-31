import { CustomerForm } from '@/components/forms/CustomerForm'

export default function NewCustomerPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新增客戶</h1>
      </div>
      <CustomerForm />
    </div>
  )
}
