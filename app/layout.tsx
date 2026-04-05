import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { SpeedInsights } from '@vercel/speed-insights/next'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: '妙根塗裝',
  description: '妙根塗裝內部管理平台',
  appleWebApp: {
    capable: true,
    title: '妙根塗裝',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">
        {children}
        <Toaster richColors position="top-right" />
        <SpeedInsights />
      </body>
    </html>
  )
}
