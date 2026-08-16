import { formatCurrency } from '@/lib/utils/date'

export interface TrendPoint {
  label: string    // 期間標籤，例如「2月」
  income: number   // 收款
  expense: number  // 支出
}

interface Props {
  data: TrendPoint[]
  height?: number
}

const INCOME_COLOR = '#2a78d6'
const EXPENSE_COLOR = '#e34948'

function fmtCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 10000) {
    const wan = n / 10000
    return `${Number.isInteger(wan) ? wan : wan.toFixed(1)}萬`
  }
  return n.toLocaleString('zh-TW')
}

/** 取得「乾淨」的軸上限：1/2/2.5/5 × 10^k */
function niceCeil(v: number): number {
  if (v <= 0) return 1
  const exp = Math.floor(Math.log10(v))
  const base = Math.pow(10, exp)
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (v <= m * base) return m * base
  }
  return 10 * base
}

/**
 * 收支趨勢圖（伺服器渲染 SVG）— 每期兩根柱：收款（藍）/ 支出（紅），
 * 柱下方顯示該期損益（正綠負紅）。
 */
export function TrendBarChart({ data, height = 200 }: Props) {
  const width = 640
  const pad = { top: 14, right: 8, bottom: 40, left: 46 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const maxVal = niceCeil(Math.max(1, ...data.map(d => Math.max(d.income, d.expense))))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => t * maxVal)

  const groupW = plotW / Math.max(data.length, 1)
  const barW = Math.min(22, (groupW - 18) / 2)
  const y = (v: number) => pad.top + plotH - (v / maxVal) * plotH
  const barH = (v: number) => (v / maxVal) * plotH

  // 4px 圓頂、底部平角的柱狀 path
  const barPath = (x: number, v: number, w: number) => {
    const h = barH(v)
    if (h <= 0) return ''
    const rr = Math.min(4, h, w / 2)
    const top = y(v)
    const bottom = pad.top + plotH
    return `M ${x} ${bottom} L ${x} ${top + rr} Q ${x} ${top} ${x + rr} ${top} L ${x + w - rr} ${top} Q ${x + w} ${top} ${x + w} ${top + rr} L ${x + w} ${bottom} Z`
  }

  return (
    <div>
      {/* 圖例 */}
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: INCOME_COLOR }} />
          收款
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EXPENSE_COLOR }} />
          支出
        </span>
        <span className="ml-auto text-gray-400">柱下數字為當期損益</span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width="100%"
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[480px]"
          role="img"
          aria-label="收支趨勢圖"
        >
          {/* 格線與 Y 軸刻度 */}
          {ticks.map(t => (
            <g key={t}>
              <line
                x1={pad.left} x2={width - pad.right}
                y1={y(t)} y2={y(t)}
                stroke={t === 0 ? '#c3c2b7' : '#e1e0d9'}
                strokeWidth={1}
              />
              <text x={pad.left - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#898781">
                {fmtCompact(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const gx = pad.left + i * groupW
            const cx = gx + groupW / 2
            const x1 = cx - barW - 1 // 收款柱（間隙 2px）
            const x2 = cx + 1       // 支出柱
            const net = d.income - d.expense
            return (
              <g key={d.label}>
                <path d={barPath(x1, d.income, barW)} fill={INCOME_COLOR}>
                  <title>{`${d.label} 收款 ${formatCurrency(d.income)}`}</title>
                </path>
                <path d={barPath(x2, d.expense, barW)} fill={EXPENSE_COLOR}>
                  <title>{`${d.label} 支出 ${formatCurrency(d.expense)}`}</title>
                </path>
                <text x={cx} y={pad.top + plotH + 14} textAnchor="middle" fontSize={11} fill="#52514e">
                  {d.label}
                </text>
                <text
                  x={cx} y={pad.top + plotH + 28}
                  textAnchor="middle" fontSize={10} fontWeight={600}
                  fill={net >= 0 ? '#006300' : '#d03b3b'}
                >
                  {net >= 0 ? '+' : '−'}{fmtCompact(Math.abs(net))}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
