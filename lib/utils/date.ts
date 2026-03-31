import { format, parseISO } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy/MM/dd', { locale: zhTW })
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy/MM/dd HH:mm', { locale: zhTW })
}

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatCurrency(amount: number): string {
  return `NT$ ${amount.toLocaleString('zh-TW')}`
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
