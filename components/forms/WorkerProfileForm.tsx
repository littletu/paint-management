'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Props {
  fullName: string
  phone: string
  email: string
}

export function WorkerProfileForm({ fullName, phone, email }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState({ full_name: fullName, phone })
  const [password, setPassword] = useState({ new_password: '', confirm_password: '' })
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile.full_name.trim()) { toast.error('請輸入姓名'); return }
    setLoadingProfile(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone || null })
      .eq('id', user!.id)

    if (error) { toast.error('更新失敗：' + error.message) }
    else { toast.success('資料已更新'); router.refresh() }
    setLoadingProfile(false)
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.new_password.length < 6) { toast.error('密碼至少需要 6 個字元'); return }
    if (password.new_password !== password.confirm_password) { toast.error('兩次密碼不一致'); return }
    setLoadingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: password.new_password })
    if (error) { toast.error('密碼更新失敗：' + error.message) }
    else {
      toast.success('密碼已更新')
      setPassword({ new_password: '', confirm_password: '' })
    }
    setLoadingPassword(false)
  }

  return (
    <div className="space-y-4">
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本資料</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">電子郵件（登入帳號）</Label>
              <Input id="email" value={email} disabled className="bg-gray-50 text-gray-500" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="full_name">姓名 *</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                placeholder="請輸入姓名"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">電話</Label>
              <Input
                id="phone"
                type="tel"
                value={profile.phone}
                onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                placeholder="聯絡電話"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loadingProfile}>
              {loadingProfile ? '儲存中...' : '儲存基本資料'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">修改密碼</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new_password">新密碼</Label>
              <Input
                id="new_password"
                type="password"
                value={password.new_password}
                onChange={e => setPassword(p => ({ ...p, new_password: e.target.value }))}
                placeholder="至少 6 個字元"
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">確認新密碼</Label>
              <Input
                id="confirm_password"
                type="password"
                value={password.confirm_password}
                onChange={e => setPassword(p => ({ ...p, confirm_password: e.target.value }))}
                placeholder="再次輸入新密碼"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loadingPassword}>
              {loadingPassword ? '更新中...' : '更新密碼'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
