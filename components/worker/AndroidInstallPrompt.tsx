'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

// Hooks into Chrome's beforeinstallprompt event (Android Chrome / desktop Chrome)
export function AndroidInstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault()
      const dismissed = localStorage.getItem('android-install-dismissed')
      if (!dismissed) setPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt) return null

  async function install() {
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
  }

  function dismiss() {
    setPrompt(null)
    localStorage.setItem('android-install-dismissed', '1')
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-40 px-3">
      <div className="bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-start gap-3">
        <Download className="w-6 h-6 shrink-0 text-orange-400 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug">安裝 App</p>
          <p className="text-xs text-gray-400 mt-0.5">將妙根塗裝加入主畫面，離線也能快速開啟</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={install}
            className="text-xs bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            安裝
          </button>
          <button onClick={dismiss} className="text-gray-500 hover:text-gray-300 active:opacity-60 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
