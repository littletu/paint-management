'use client'

import { useEffect } from 'react'

export function PrintActions() {
  useEffect(() => {
    window.print()
  }, [])

  return (
    <div className="print:hidden flex gap-2 mb-4">
      <button
        onClick={() => window.print()}
        className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600"
      >
        列印
      </button>
      <button
        onClick={() => window.close()}
        className="px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg border border-gray-200 hover:bg-gray-200"
      >
        關閉
      </button>
    </div>
  )
}
