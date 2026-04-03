'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = { error: '' }

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <img
              src="https://scontent.ftpe7-1.fna.fbcdn.net/v/t39.30808-6/306268167_487897963347179_6580466889691609007_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=JrcMXqHVSBkQ7kNvwGUD1Kg&_nc_oc=AdpDHqK3RMMnQ8fIepv8yVL_G8OaW1XjALzTBPbLsufZw1mkxeO4sEa6loy37TaA_9Y&_nc_zt=23&_nc_ht=scontent.ftpe7-1.fna&_nc_gid=K4XXQCBkkJacO1yUKMFTzA&_nc_ss=7a3a8&oh=00_Af0uV62xr0EW8nEDn8FcVZN4Xfo5OUBVwCRpeYc-oHlfJg&oe=69D2CDFA"
              alt="妙根塗裝"
              className="w-20 h-20 rounded-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl">妙根塗裝</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">請登入您的帳號</p>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">電子郵件 或 手機號碼</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="email 或 09xxxxxxxx"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="請輸入密碼"
                required
                autoComplete="current-password"
              />
            </div>
            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? '登入中...' : '登入'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
