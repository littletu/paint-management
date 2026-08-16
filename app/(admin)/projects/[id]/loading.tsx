export default function Loading() {
  return (
    <div className="max-w-4xl animate-pulse">
      <div className="mb-6">
        <div className="h-4 w-24 bg-gray-100 rounded mb-4" />
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-40 bg-gray-100 rounded" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-20 bg-white border border-gray-100 rounded-xl" />
        ))}
      </div>
      <div className="h-56 bg-white border border-gray-100 rounded-xl mb-8" />
      <div className="h-10 w-full bg-gray-100 rounded-lg mb-4" />
      <div className="h-64 bg-white border border-gray-100 rounded-xl" />
    </div>
  )
}
