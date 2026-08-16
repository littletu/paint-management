export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-6">
        <div className="h-8 w-28 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-24 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-white border border-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 bg-white border border-gray-100 rounded-xl" />
        <div className="h-64 bg-white border border-gray-100 rounded-xl" />
        <div className="h-72 bg-white border border-gray-100 rounded-xl lg:col-span-2" />
      </div>
    </div>
  )
}
