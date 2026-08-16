'use client'

import { useState, useEffect } from 'react'
import { X, Share } from 'lucide-react'

// Shows once on iOS Safari. Dismissed state persists in localStorage.
export function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const isIOS = /iphone|ipad|ipod/i.test(ua)
    const isStandalone = ('standalone' in navigator) && (navigator as any).standalone === true
    const dismissed = localStorage.getItem('ios-install-dismissed')
    if (isIOS && !isStandalone && !dismissed) {
      // Short delay so the page settles before showing the banner
      const t = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem('ios-install-dismissed', '1')
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-40 px-3">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-start gap-3">
        <Share className="w-6 h-6 shrink-0 text-orange-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">安裝到主畫面</p>
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            點擊下方 Safari 的<span className="text-white font-medium">「分享」</span>圖示，再選「加入主畫面」，下次一鍵開啟
          </p>
        </div>
        <button onClick={dismiss} className="shrink-0 text-gray-500 hover:text-gray-300 active:opacity-60 p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
