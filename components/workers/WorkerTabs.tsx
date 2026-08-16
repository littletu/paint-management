'use client'

import { type ReactNode } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { User, Wallet, Clock } from 'lucide-react'

interface Props {
  profile: ReactNode
  payroll: ReactNode
  timeEntries: ReactNode
}

export function WorkerTabs({ profile, payroll, timeEntries }: Props) {
  return (
    <Tabs defaultValue="profile">
      <TabsList variant="line" className="w-full border-b border-gray-100 rounded-none pb-0 mb-4">
        <TabsTrigger value="profile" className="gap-1.5">
          <User className="w-3.5 h-3.5" />
          個人資料
        </TabsTrigger>
        <TabsTrigger value="payroll" className="gap-1.5">
          <Wallet className="w-3.5 h-3.5" />
          過去薪資
        </TabsTrigger>
        <TabsTrigger value="time" className="gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          工時記錄
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">{profile}</TabsContent>
      <TabsContent value="payroll">{payroll}</TabsContent>
      <TabsContent value="time">{timeEntries}</TabsContent>
    </Tabs>
  )
}
