import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function fmt(n: number) {
  return 'NT$ ' + Math.round(n).toLocaleString('zh-TW')
}

function fmtDate(s: string) {
  const d = new Date(s + 'T00:00:00')
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`
}

const statusLabel: Record<string, string> = { draft: '草稿', confirmed: '已確認', paid: '已發薪' }
const statusColor: Record<string, string> = {
  draft: '#6b7280',
  confirmed: '#1d4ed8',
  paid: '#15803d',
}
const statusBg: Record<string, string> = {
  draft: '#f3f4f6',
  confirmed: '#dbeafe',
  paid: '#dcfce7',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return new NextResponse('Missing id', { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: record } = await supabase
    .from('payroll_records')
    .select('*, worker:workers(daily_rate, overtime_rate, profile:profiles(full_name))')
    .eq('id', id)
    .single()

  if (!record) return new NextResponse('Not found', { status: 404 })

  const { data: entries } = await supabase
    .from('time_entries')
    .select('*, project:projects(name)')
    .eq('worker_id', record.worker_id)
    .gte('work_date', record.period_start)
    .lte('work_date', record.period_end)
    .order('work_date', { ascending: true })

  const worker = record.worker as any
  const name = worker?.profile?.full_name ?? '—'
  const period = `${record.period_start.replace(/-/g, '/')} ～ ${record.period_end.replace(/-/g, '/')}`
  const today = new Date().toLocaleDateString('zh-TW')

  // Build summary items
  type SummaryItem = { label: string; value: string; sub?: string; total?: boolean; red?: boolean }
  const summaryItems: SummaryItem[] = []
  summaryItems.push({ label: '日薪薪資', value: fmt(record.regular_amount), sub: `${record.regular_days}天 × ${fmt(worker?.daily_rate ?? 0)}` })
  if (record.overtime_hours > 0)
    summaryItems.push({ label: '加班薪資', value: fmt(record.overtime_amount), sub: `${record.overtime_hours}h × ${fmt(worker?.overtime_rate ?? 0)}` })
  if (record.transportation_total > 0)
    summaryItems.push({ label: '交通費', value: fmt(record.transportation_total) })
  if (record.meal_total > 0)
    summaryItems.push({ label: '餐費', value: fmt(record.meal_total) })
  if (record.advance_total > 0)
    summaryItems.push({ label: '代墊費', value: fmt(record.advance_total) })
  if (record.subsidy_total > 0)
    summaryItems.push({ label: '補貼', value: fmt(record.subsidy_total) })
  if (record.other_total > 0)
    summaryItems.push({ label: '其他費用', value: fmt(record.other_total) })
  if (record.deduction_amount > 0)
    summaryItems.push({ label: '扣款', value: `-${fmt(record.deduction_amount)}`, red: true })
  summaryItems.push({ label: '實領合計', value: fmt(record.net_amount), total: true })

  const summaryRows = summaryItems.map(item => `
    <tr class="${item.total ? 'total-row' : ''}${item.red ? ' red-row' : ''}">
      <td class="s-label">${item.label}</td>
      <td class="s-value">
        ${item.value}
        ${item.sub ? `<span class="s-sub">${item.sub}</span>` : ''}
      </td>
    </tr>`).join('')

  // Build daily entry rows
  const entryRows = (entries ?? []).map((e: any) => {
    const fees: string[] = []
    if (e.transportation_fee > 0) fees.push(`交通 ${fmt(e.transportation_fee)}`)
    if (e.meal_fee > 0) fees.push(`餐 ${fmt(e.meal_fee)}`)
    if (e.advance_payment > 0) fees.push(`墊 ${fmt(e.advance_payment)}`)
    if (e.subsidy > 0) fees.push(`貼 ${fmt(e.subsidy)}`)
    if (e.other_fee > 0) fees.push(`其他 ${fmt(e.other_fee)}`)
    return `
      <tr>
        <td class="d-date">${fmtDate(e.work_date)}</td>
        <td class="d-proj">${e.project?.name ?? '—'}</td>
        <td class="d-work">${e.regular_days}天${e.overtime_hours > 0 ? ` +${e.overtime_hours}h` : ''}</td>
        <td class="d-fee">${fees.join(' ') || '—'}</td>
        <td class="d-note">${e.work_progress ?? '—'}</td>
      </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>薪資單 ${name} ${period}</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Screen preview ── */
    body {
      font-family: -apple-system, 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      background: #e5e7eb;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 32px 16px;
    }
    .page {
      background: #fff;
      width: 794px;           /* A4 at 96dpi */
      min-height: 1123px;     /* A4 at 96dpi */
      padding: 36px 40px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    /* ── Page header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 10px;
      border-bottom: 2px solid #111;
      margin-bottom: 14px;
    }
    .page-title { font-size: 20px; font-weight: 800; color: #111; }
    .page-company { font-size: 11px; color: #888; margin-bottom: 2px; }
    .page-right { text-align: right; }
    .worker-name { font-size: 18px; font-weight: 700; color: #111; }
    .period-line { font-size: 12px; color: #555; margin-top: 2px; }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 99px;
      margin-left: 8px;
      vertical-align: middle;
    }

    /* ── Net amount banner ── */
    .net-banner {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
      padding: 10px 18px;
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 16px;
    }
    .net-label { font-size: 13px; color: #c2410c; }
    .net-amount { font-size: 28px; font-weight: 800; color: #c2410c; letter-spacing: -0.5px; }

    /* ── Two-column body ── */
    .body-cols {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 20px;
      flex: 1;
    }

    /* ── Left: summary table ── */
    .summary-section {}
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    .summary-table td { padding: 6px 4px; border-bottom: 1px solid #f3f4f6; }
    .summary-table tr:last-child td { border-bottom: none; }
    .s-label { color: #555; }
    .s-value { text-align: right; font-weight: 500; color: #111; white-space: nowrap; }
    .s-sub { display: block; font-size: 10px; color: #aaa; font-weight: 400; }
    .total-row td {
      border-top: 2px solid #111;
      border-bottom: none;
      padding-top: 8px;
      font-weight: 700;
      font-size: 14px;
    }
    .total-row .s-value { color: #c2410c; }
    .red-row .s-value { color: #dc2626; }

    /* notes */
    .notes {
      margin-top: 12px;
      background: #f9fafb;
      border-left: 3px solid #e5e7eb;
      padding: 7px 10px;
      font-size: 11px;
      color: #666;
      border-radius: 0 4px 4px 0;
    }

    /* ── Right: daily detail table ── */
    .detail-section {}
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .detail-table thead tr {
      border-bottom: 2px solid #374151;
    }
    .detail-table th {
      padding: 5px 6px;
      font-size: 10px;
      font-weight: 700;
      color: #374151;
      text-align: left;
      white-space: nowrap;
    }
    .detail-table td {
      padding: 5px 6px;
      border-bottom: 1px solid #f0f0f0;
      color: #374151;
      vertical-align: top;
    }
    .detail-table tbody tr:last-child td { border-bottom: none; }
    .d-date { white-space: nowrap; font-weight: 600; color: #111; }
    .d-proj { color: #6b7280; max-width: 90px; }
    .d-work { white-space: nowrap; color: #374151; }
    .d-fee  { color: #4b5563; font-size: 10px; }
    .d-note { color: #9ca3af; font-size: 10px; max-width: 100px; }
    .detail-footer {
      display: flex;
      justify-content: flex-end;
      gap: 20px;
      padding: 7px 6px 0;
      border-top: 2px solid #374151;
      font-size: 12px;
      font-weight: 700;
      color: #111;
      margin-top: 2px;
    }

    /* ── Page footer ── */
    .page-footer {
      margin-top: 18px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #bbb;
    }

    /* ── Print overrides ── */
    @media print {
      @page { size: A4; margin: 12mm; }
      html, body { background: #fff !important; padding: 0 !important; }
      .page {
        width: 100%;
        min-height: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">

    <!-- Header -->
    <div class="page-header">
      <div>
        <div class="page-company">妙根塗裝</div>
        <div class="page-title">薪資單</div>
      </div>
      <div class="page-right">
        <div class="worker-name">
          ${name}
          <span class="badge" style="background:${statusBg[record.status] ?? '#f3f4f6'};color:${statusColor[record.status] ?? '#6b7280'}">${statusLabel[record.status] ?? record.status}</span>
        </div>
        <div class="period-line">${period}</div>
      </div>
    </div>

    <!-- Net amount banner -->
    <div class="net-banner">
      <span class="net-label">實領金額</span>
      <span class="net-amount">${fmt(record.net_amount)}</span>
    </div>

    <!-- Two-column body -->
    <div class="body-cols">

      <!-- Left: salary summary -->
      <div class="summary-section">
        <div class="section-title">薪資明細</div>
        <table class="summary-table">
          <tbody>${summaryRows}</tbody>
        </table>
        ${record.notes ? `<div class="notes">${record.notes}</div>` : ''}
      </div>

      <!-- Right: daily breakdown -->
      <div class="detail-section">
        <div class="section-title">每日工時明細（共 ${(entries ?? []).length} 筆）</div>
        ${(entries ?? []).length > 0 ? `
        <table class="detail-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>工程</th>
              <th>工時</th>
              <th>費用</th>
              <th>施工概況</th>
            </tr>
          </thead>
          <tbody>${entryRows}</tbody>
        </table>
        <div class="detail-footer">
          <span>合計出工 ${record.regular_days} 天</span>
          ${record.overtime_hours > 0 ? `<span>加班 ${record.overtime_hours} h</span>` : ''}
        </div>
        ` : '<p style="font-size:12px;color:#9ca3af;padding:8px 0">本期間無工時紀錄</p>'}
      </div>

    </div>

    <!-- Footer -->
    <div class="page-footer">
      <span>妙根塗裝管理系統</span>
      <span>列印日期：${today}</span>
    </div>

  </div>

  <script>
    // Auto-open print dialog when the page loads
    window.addEventListener('load', () => window.print())
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
