'use client'

export default function AccountingError({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 rounded-lg">
      <h2 className="text-red-700 font-bold mb-2">帳目總覽載入失敗</h2>
      <pre className="text-xs text-red-600 whitespace-pre-wrap">{error.message}</pre>
    </div>
  )
}
