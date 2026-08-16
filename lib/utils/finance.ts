// 財務計算 — 與 lib/utils/payroll.ts 的 calculatePayroll 口徑一致：
// 人工成本 = 工數×日薪 + 加班×時薪 + 交通/餐費/代墊/補貼/其他費用

export interface RateInfo {
  daily_rate: number
  overtime_rate: number
}

export interface LaborEntry {
  worker_id: string
  regular_days: number | null
  overtime_hours: number | null
  transportation_fee: number | null
  meal_fee: number | null
  advance_payment: number | null
  subsidy: number | null
  other_fee: number | null
}

export interface LaborSummary {
  cost: number          // 人工總成本（工資 + 各項費用）
  wageCost: number      // 純工資（工數 + 加班）
  feeCost: number       // 費用（交通/餐費/代墊/補貼/其他）
  regularDays: number   // 總工數
  overtimeHours: number // 總加班時數
}

export function summarizeLabor(
  entries: LaborEntry[],
  rates: Map<string, RateInfo>
): LaborSummary {
  let wageCost = 0
  let feeCost = 0
  let regularDays = 0
  let overtimeHours = 0

  for (const e of entries) {
    const rate = rates.get(e.worker_id)
    const days = e.regular_days ?? 0
    const ot = e.overtime_hours ?? 0
    regularDays += days
    overtimeHours += ot
    if (rate) {
      wageCost += days * rate.daily_rate + ot * rate.overtime_rate
    }
    feeCost +=
      (e.transportation_fee ?? 0) +
      (e.meal_fee ?? 0) +
      (e.advance_payment ?? 0) +
      (e.subsidy ?? 0) +
      (e.other_fee ?? 0)
  }

  return { cost: wageCost + feeCost, wageCost, feeCost, regularDays, overtimeHours }
}

export interface ProjectFinance {
  contractAmount: number
  totalInvoiced: number   // 已請款（非取消）
  totalPaid: number       // 已收款
  laborCost: number       // 人工成本
  expenseCost: number     // 工程開銷
  receiptCost: number     // 師傅發票
  totalCost: number       // 總成本
  grossProfit: number     // 預估毛利 = 收入基準 − 總成本
  grossMargin: number | null // 毛利率（無收入基準時為 null）
  revenueBase: number     // 收入基準（合約金額，未填則用已請款）
}

export function computeProjectFinance(input: {
  contractAmount: number
  totalInvoiced: number
  totalPaid: number
  laborCost: number
  expenseCost: number
  receiptCost: number
}): ProjectFinance {
  const totalCost = input.laborCost + input.expenseCost + input.receiptCost
  const revenueBase = input.contractAmount > 0 ? input.contractAmount : input.totalInvoiced
  const grossProfit = revenueBase - totalCost
  const grossMargin = revenueBase > 0 ? grossProfit / revenueBase : null

  return {
    ...input,
    totalCost,
    grossProfit,
    grossMargin,
    revenueBase,
  }
}
