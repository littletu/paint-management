export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-28 bg-gray-200 rounded" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-12 bg-white border border-gray-100 rounded-xl mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="h-7 w-36 bg-orange-50 rounded-full" />
              <div className="h-7 w-28 bg-green-50 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
