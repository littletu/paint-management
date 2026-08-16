import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 效能設計：
 * - 無 session cookie 的請求直接導向 /login，零網路請求
 * - 用 getClaims() 本地驗證 JWT（非對稱金鑰時不需打 Auth server；快過期會自動刷新）
 * - 角色路由守衛交給 (admin)/(worker) 的 layout 處理（那裡有最新資料），
 *   proxy 只在「已登入者造訪 /login」時查一次角色決定導向
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const publicPaths = ['/login', '/api/auth/']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  // 沒有任何 Supabase session cookie → 不需驗證
  const hasAuthCookie = request.cookies
    .getAll()
    .some(c => c.name.startsWith('sb-') && c.name.includes('-auth-token'))
  if (!hasAuthCookie) {
    if (isPublic) return NextResponse.next({ request })
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getClaims()
  const claims = error ? null : data?.claims

  if (!claims && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登入者造訪 /login → 依角色導向
  if (claims && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', claims.sub)
      .single()

    if (profile?.role === 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // worker 與 manager 都使用員工介面
    return NextResponse.redirect(new URL('/worker/work-log', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon-192|icon-512|apple-icon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
