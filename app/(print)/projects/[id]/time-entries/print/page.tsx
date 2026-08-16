import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, formatCurrency } from '@/lib/utils/date'
import { PrintActions } from '@/components/print/PrintActions'
import type { Metadata } from 'next'

interface SearchParams {
  worker_id?: string
  date_from?: string
  date_to?: string
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('name').eq('id', id).single()
  return { title: `${data?.name ?? '工程'} — 工時記錄` }
}

export default async function TimeEntriesPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const [{ data: project }, entriesRes] = await Promise.all([
    supabase.from('projects').select('name, customer:customers(name)').eq('id', id).single(),
    (() => {
      let q = supabase
        .from('time_entries')
        .select('*, worker:workers(profile:profiles(full_name))')
        .eq('project_id', id)
        .order('work_date', { ascending: true })
      if (sp.worker_id) q = q.eq('worker_id', sp.worker_id)
      if (sp.date_from) q = q.gte('work_date', sp.date_from)
      if (sp.date_to) q = q.lte('work_date', sp.date_to)
      return q
    })(),
  ])

  if (!project) notFound()

  const entries = entriesRes.data ?? []
  const customer = (project.customer as any)?.name

  const totalDays = entries.reduce((s, e) => s + (e.regular_days || 0), 0)
  const totalOvertime = entries.reduce((s, e) => s + (e.overtime_hours || 0), 0)
  const colSum = (key: string) => entries.reduce((s: number, e: any) => s + (e[key] || 0), 0)
  const fmtSum = (key: string) => colSum(key) > 0 ? formatCurrency(colSum(key)) : '—'
  const totalFees = colSum('transportation_fee') + colSum('meal_fee') + colSum('advance_payment') + colSum('subsidy') + colSum('other_fee')
  const dateRange = sp.date_from || sp.date_to
    ? `${sp.date_from ? formatDate(sp.date_from) : '—'} 至 ${sp.date_to ? formatDate(sp.date_to) : '—'}`
    : null

  return (
    <div style={{ padding: '24px', maxWidth: '900px', fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#111' }}>
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { padding: 0; }
        }
      `}</style>

      <PrintActions />

      <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{project.name}</h1>
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        {customer && <>{customer}　</>}工時記錄
        {dateRange && <>　期間：{dateRange}</>}
        　列印日期：{formatDate(new Date().toISOString().slice(0, 10))}
      </p>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '28px', padding: '10px 14px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '16px' }}>
        {[
          { label: '筆數', value: `${entries.length} 筆` },
          { label: '總工數', value: `${totalDays} 天` },
          { label: '加班時數', value: `${totalOvertime} h` },
          ...(totalFees > 0 ? [{ label: '各項費用', value: formatCurrency(totalFees) }] : []),
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            {['日期', '師傅', '工數', '加班', '交通', '餐費', '代墊', '補貼', '其他', '施工概況'].map((h, i) => (
              <th key={h} style={{ padding: '7px 10px', fontWeight: 600, borderBottom: '2px solid #d1d5db', whiteSpace: 'nowrap', textAlign: i >= 2 && i <= 8 ? 'right' : 'left' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry: any) => (
            <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{formatDate(entry.work_date)}</td>
              <td style={{ padding: '6px 10px' }}>{entry.worker?.profile?.full_name ?? '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.regular_days} 天</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.overtime_hours > 0 ? `${entry.overtime_hours}h` : '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.transportation_fee > 0 ? formatCurrency(entry.transportation_fee) : '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.meal_fee > 0 ? formatCurrency(entry.meal_fee) : '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.advance_payment > 0 ? formatCurrency(entry.advance_payment) : '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.subsidy > 0 ? formatCurrency(entry.subsidy) : '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{entry.other_fee > 0 ? formatCurrency(entry.other_fee) : '—'}</td>
              <td style={{ padding: '6px 10px', maxWidth: '160px', fontSize: '10px', color: '#555', wordBreak: 'break-all' }}>{entry.work_progress || '—'}</td>
            </tr>
          ))}
        </tbody>
        {entries.length > 0 && (
          <tfoot>
            <tr style={{ background: '#f9fafb', borderTop: '2px solid #d1d5db', fontWeight: 700 }}>
              <td colSpan={2} style={{ padding: '6px 10px' }}>合計</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{totalDays} 天</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{totalOvertime > 0 ? `${totalOvertime}h` : '—'}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtSum('transportation_fee')}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtSum('meal_fee')}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtSum('advance_payment')}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtSum('subsidy')}</td>
              <td style={{ padding: '6px 10px', textAlign: 'right' }}>{fmtSum('other_fee')}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
