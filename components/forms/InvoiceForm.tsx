'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { todayString, formatCurrency } from '@/lib/utils/date'
import { Plus, Trash2 } from 'lucide-react'

interface CustomerOption {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
}

interface ProjectOption {
  id: string
  name: string
  customer_id: string | null
}

interface Props {
  customers: CustomerOption[]
  projects: ProjectOption[]
}

interface LineItem {
  description: string
  quantity: string
  unit_price: string
}

const selectCls =
  'w-full h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function emptyItem(): LineItem {
  return { description: '', quantity: '1', unit_price: '' }
}

export function InvoiceForm({ customers, projects }: Props) {
  const router = useRouter()

  const [customerId, setCustomerId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [issueDate, setIssueDate] = useState(todayString())
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState('0')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [loading, setLoading] = useState(false)

  // Filter projects by selected customer
  const filteredProjects = customerId
    ? projects.filter(p => p.customer_id === customerId)
    : projects

  function handleItemChange(index: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()])
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  // Calculated values
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0
    const price = parseFloat(item.unit_price) || 0
    return sum + qty * price
  }, 0)

  const taxRateNum = parseFloat(taxRate) || 0
  const taxAmount = subtotal * (taxRateNum / 100)
  const total = subtotal + taxAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!customerId) { toast.error('請選擇客戶'); return }

    const validItems = items.filter(it => it.description.trim())
    if (!validItems.length) { toast.error('請至少新增一筆明細'); return }

    setLoading(true)

    try {
      const payload = {
        customer_id: customerId || null,
        project_id: projectId || null,
        issue_date: issueDate,
        due_date: dueDate || null,
        tax_rate: taxRateNum,
        notes: notes || null,
        items: validItems.map((item, idx) => ({
          description: item.description,
          quantity: parseFloat(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0,
          amount: (parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0),
          sort_order: idx,
        })),
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? '新增失敗')
        setLoading(false)
        return
      }

      toast.success(`請款單 ${data.invoice_number} 已建立`)
      router.push('/invoices/' + data.id)
    } catch {
      toast.error('網路錯誤，請稍後再試')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>客戶 *</Label>
            <select
              value={customerId}
              onChange={e => { setCustomerId(e.target.value); setProjectId('') }}
              className={selectCls}
            >
              <option value="">選擇客戶</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>工程</Label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className={selectCls}
            >
              <option value="">選擇工程（選填）</option>
              {filteredProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>開立日期</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>付款期限（選填）</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">請款明細</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
            <div className="col-span-5">說明</div>
            <div className="col-span-2 text-right">數量</div>
            <div className="col-span-3 text-right">單價</div>
            <div className="col-span-1 text-right">小計</div>
            <div className="col-span-1" />
          </div>

          {items.map((item, idx) => {
            const qty = parseFloat(item.quantity) || 0
            const price = parseFloat(item.unit_price) || 0
            const amount = qty * price
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Input
                    placeholder="項目說明"
                    value={item.description}
                    onChange={e => handleItemChange(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={item.unit_price}
                    onChange={e => handleItemChange(idx, 'unit_price', e.target.value)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 text-right text-sm text-gray-700 font-medium">
                  {amount > 0 ? amount.toLocaleString('zh-TW') : '—'}
                </div>
                <div className="col-span-1 flex justify-end">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
            <Plus className="w-4 h-4 mr-1" />
            新增明細
          </Button>
        </CardContent>
      </Card>

      {/* Summary & tax */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">金額摘要</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>稅率 (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={e => setTaxRate(e.target.value)}
              className="w-32"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>小計</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>稅額（{taxRateNum}%）</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
              <span>合計</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">備註</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="備註說明（選填）"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? '建立中...' : '建立請款單'}
      </Button>
    </form>
  )
}
