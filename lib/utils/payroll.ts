import type { TimeEntry, Worker, PayrollRecord } from '@/types'

export function calculatePayroll(
  entries: TimeEntry[],
  worker: Worker,
  periodStart: string,
  periodEnd: string
): Omit<PayrollRecord, 'id' | 'status' | 'confirmed_at' | 'notes'> {
  const regularHours = entries.reduce((sum, e) => sum + (e.regular_hours || 0), 0)
  const overtimeHours = entries.reduce((sum, e) => sum + (e.overtime_hours || 0), 0)
  const transportationTotal = entries.reduce((sum, e) => sum + (e.transportation_fee || 0), 0)
  const mealTotal = entries.reduce((sum, e) => sum + (e.meal_fee || 0), 0)
  const advanceTotal = entries.reduce((sum, e) => sum + (e.advance_payment || 0), 0)
  const subsidyTotal = entries.reduce((sum, e) => sum + (e.subsidy || 0), 0)
  const otherTotal = entries.reduce((sum, e) => sum + (e.other_fee || 0), 0)

  const regularAmount = regularHours * worker.hourly_rate
  const overtimeAmount = overtimeHours * worker.overtime_rate

  const netAmount =
    regularAmount +
    overtimeAmount +
    transportationTotal +
    mealTotal +
    advanceTotal +
    subsidyTotal +
    otherTotal

  return {
    worker_id: worker.id,
    period_start: periodStart,
    period_end: periodEnd,
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    regular_amount: regularAmount,
    overtime_amount: overtimeAmount,
    transportation_total: transportationTotal,
    meal_total: mealTotal,
    advance_total: advanceTotal,
    subsidy_total: subsidyTotal,
    other_total: otherTotal,
    deduction_amount: 0,
    net_amount: netAmount,
  }
}

export function getBiweeklyPeriods(year: number, month: number): Array<{ start: string; end: string; label: string }> {
  // Period 1: 1st ~ 15th, Period 2: 16th ~ end of month
  const pad = (n: number) => String(n).padStart(2, '0')
  const lastDay = new Date(year, month, 0).getDate()

  return [
    {
      start: `${year}-${pad(month)}-01`,
      end: `${year}-${pad(month)}-15`,
      label: `${year}/${pad(month)}/01 - ${year}/${pad(month)}/15`,
    },
    {
      start: `${year}-${pad(month)}-16`,
      end: `${year}-${pad(month)}-${lastDay}`,
      label: `${year}/${pad(month)}/16 - ${year}/${pad(month)}/${lastDay}`,
    },
  ]
}
