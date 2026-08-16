import { cn } from '@/lib/utils'

interface Props {
  label: string
  /** 0–1+，超過 1 代表超支/超額 */
  ratio: number
  /** 右側顯示文字（例如金額或百分比） */
  valueText: string
  /** 超過 1 時以紅色警示 */
  dangerOnOverflow?: boolean
}

/** 單一比率量表 — 填色與軌道同色系（藍），超額轉紅 */
export function Meter({ label, ratio, valueText, dangerOnOverflow = true }: Props) {
  const over = dangerOnOverflow && ratio > 1
  const pct = Math.min(Math.max(ratio, 0), 1) * 100

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={cn('text-xs font-semibold tabular-nums', over ? 'text-[#d03b3b]' : 'text-gray-700')}>
          {valueText}
        </span>
      </div>
      <div className={cn('h-2 rounded-full overflow-hidden', over ? 'bg-[#f7d5d5]' : 'bg-[#cde2fb]')}>
        <div
          className={cn('h-full rounded-full', over ? 'bg-[#d03b3b]' : 'bg-[#2a78d6]')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
