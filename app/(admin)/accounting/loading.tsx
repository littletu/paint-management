export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="h-8 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-64 bg-gray-100 rounded-lg" />
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-3 sm:grid-cols-3 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-24 bg-white border border-gray-100 rounded-xl" />
        ))}
      </div>

      {/* 圖表區 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="lg:col-span-3 h-72 bg-white border border-gray-100 rounded-xl" />
        <div className="lg:col-span-2 h-72 bg-white border border-gray-100 rounded-xl" />
      </div>

      {/* 損益排行 */}
      <div className="h-80 bg-white border border-gray-100 rounded-xl mt-6" />
    </div>
  )
}
