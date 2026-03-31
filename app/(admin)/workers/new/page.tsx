import { WorkerForm } from '@/components/forms/WorkerForm'

export default function NewWorkerPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">新增師傅</h1>
        <p className="text-sm text-gray-500 mt-1">建立師傅帳號後，師傅可用電子郵件與密碼登入行動版介面</p>
      </div>
      <WorkerForm />
    </div>
  )
}
