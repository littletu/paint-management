import { formatCurrency } from '@/lib/utils/date'

export interface DonutSegment {
  label: string
  value: number
  color: string
}

interface Props {
  segments: DonutSegment[]
  centerLabel: string
  /** 中心顯示的總值（預設為各段加總） */
  centerValue?: number
  size?: number
}

/**
 * 圓環圖（伺服器渲染 SVG）— 各段之間留 2px 表面間隙，
 * 完整數值圖例列於右側（低對比色的補償通道）。
 */
export function DonutChart({ segments, centerLabel, centerValue, size = 148 }: Props) {
  const visible = segments.filter(s => s.value > 0)
  const total = visible.reduce((s, seg) => s + seg.value, 0)
  const displayTotal = centerValue ?? total

  const cx = size / 2
  const cy = size / 2
  const strokeW = 18
  const r = (size - strokeW) / 2

  // 2px 表面間隙換算成角度
  const gapAngle = total > 0 && visible.length > 1 ? (2 / r) * (180 / Math.PI) : 0

  let angle = -90 // 從 12 點鐘方向開始
  const arcs = visible.map(seg => {
    const sweep = (seg.value / total) * 360
    const a0 = angle + gapAngle / 2
    const a1 = angle + sweep - gapAngle / 2
    angle += sweep
    if (a1 <= a0) return { ...seg, d: '' }
    const rad = (deg: number) => (deg * Math.PI) / 180
    const x0 = cx + r * Math.cos(rad(a0))
    const y0 = cy + r * Math.sin(rad(a0))
    const x1 = cx + r * Math.cos(rad(a1))
    const y1 = cy + r * Math.sin(rad(a1))
    const largeArc = a1 - a0 > 180 ? 1 : 0
    return { ...seg, d: `M ${x0} ${y0} A ${r} ${r} 0 ${largeArc} 1 ${x1} ${y1}` }
  })

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel}>
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0efec" strokeWidth={strokeW} />
          ) : visible.length === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={visible[0].color} strokeWidth={strokeW}>
              <title>{`${visible[0].label} ${formatCurrency(visible[0].value)}`}</title>
            </circle>
          ) : (
            arcs.map(seg =>
              seg.d ? (
                <path key={seg.label} d={seg.d} fill="none" stroke={seg.color} strokeWidth={strokeW} strokeLinecap="butt">
                  <title>{`${seg.label} ${formatCurrency(seg.value)}（${Math.round((seg.value / total) * 100)}%）`}</title>
                </path>
              ) : null
            )
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-gray-400">{centerLabel}</span>
          <span className="text-sm font-bold text-gray-900 leading-tight px-3">
            {formatCurrency(displayTotal)}
          </span>
        </div>
      </div>

      {/* 圖例（含完整數值 — 表格檢視） */}
      <div className="flex-1 min-w-[160px] space-y-1.5">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-gray-500">{seg.label}</span>
            <span className="ml-auto font-medium text-gray-800 tabular-nums">{formatCurrency(seg.value)}</span>
            <span className="text-gray-400 tabular-nums w-9 text-right">
              {total > 0 ? `${Math.round((seg.value / total) * 100)}%` : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
