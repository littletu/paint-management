import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, User, Phone, MapPin } from 'lucide-react'
import type { Customer } from '@/types'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">客戶管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {customers?.length ?? 0} 位客戶</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            新增客戶
          </Button>
        </Link>
      </div>

      {!customers?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <User className="w-10 h-10 mb-3 opacity-40" />
            <p>尚無客戶資料</p>
            <Link href="/customers/new" className="mt-3">
              <Button variant="outline" size="sm">新增第一位客戶</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer: Customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-base leading-tight">{customer.name}</h3>
                    <Badge variant="secondary">客戶</Badge>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    {customer.contact_person && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        {customer.contact_person}
                      </div>
                    )}
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{customer.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
