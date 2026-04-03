import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/date'

const statusLabel: Record<string, string> = {
  draft: '草稿',
  sent: '已送出',
  paid: '已付款',
  cancelled: '已取消',
}

const statusClass: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

interface SearchParams {
  status?: string
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { status } = await searchParams
  const supabase = await createClient()

  // Diagnostic: verify auth
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user
    ? await supabase.from('profiles').select('role').eq('id', user.id).single()
    : { data: null }

  const { data: allInvoices, error: invoicesError } = await supabase
    .from('invoices')
    .select('*, customer:customers(name), project:projects(name)')
    .order('created_at', { ascending: false })
    .limit(500)

  if (invoicesError || !user || profile?.role !== 'admin') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 space-y-1">
        <p className="font-semibold mb-1">診斷資訊</p>
        <p>登入狀態：{user ? `✅ ${user.email}` : '❌ 未登入'}</p>
        <p>角色：{profile?.role ?? '❌ 查無 profile'}</p>
        {invoicesError && <p className="font-mono">查詢錯誤：{invoicesError.message}</p>}
        {!invoicesError && user && profile?.role !== 'admin' && (
          <p>⚠️ 目前角色 <strong>{profile?.role}</strong> 沒有 admin 權限，RLS 會擋住所有請款單查詢</p>
        )}
      </div>
    )
  }

  const invoices = allInvoices ?? []

  const filtered = status ? invoices.filter(inv => inv.status === status) : invoices

  const totalAmount = invoices.reduce((s, inv) => s + (inv.total || 0), 0)
  const pendingAmount = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((s, inv) => s + (inv.total || 0), 0)

  const statusFilters = [
    { key: '', label: '全部' },
    { key: 'draft', label: '草稿' },
    { key: 'sent', label: '已送出' },
    { key: 'paid', label: '已付款' },
    { key: 'cancelled', label: '已取消' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">請款管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {invoices.length} 筆　合計 {formatCurrency(totalAmount)}　待收款 {formatCurrency(pendingAmount)}
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增請款單
          </Button>
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map(f => (
          <Link
            key={f.key}
            href={f.key ? `/invoices?status=${f.key}` : '/invoices'}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (status ?? '') === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Invoice list */}
      {!filtered.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
            <p>{invoices.length ? '沒有符合條件的請款單' : '尚無請款單'}</p>
            {!invoices.length && (
              <Link href="/invoices/new" className="mt-3">
                <Button variant="outline" size="sm">新增第一筆請款單</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {filtered.map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-sm text-gray-900">{inv.invoice_number}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusClass[inv.status]}`}
                      >
                        {statusLabel[inv.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {(inv.customer as any)?.name ?? '—'}
                      {(inv.project as any)?.name && (
                        <span className="text-gray-400 ml-2">· {(inv.project as any).name}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(inv.issue_date)}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold text-gray-900">{formatCurrency(inv.total)}</p>
                    {inv.status === 'paid' && (
                      <p className="text-xs text-green-600 mt-0.5">已全額收款</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
