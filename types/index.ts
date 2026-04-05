export type UserRole = 'admin' | 'worker'

/** @deprecated Use KnowledgeDBCategory from DB instead */
export type KnowledgeCategory =
  | 'technique'
  | 'material'
  | 'quality'
  | 'troubleshoot'
  | 'safety'
  | 'general'

/** @deprecated Use KNOWLEDGE_COLOR_CLASSES with KnowledgeDBCategory instead */
export const KNOWLEDGE_CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  technique:    '施工技巧',
  material:     '材料知識',
  quality:      '品質要點',
  troubleshoot: '問題排解',
  safety:       '安全注意',
  general:      '一般分享',
}

/** @deprecated Use KNOWLEDGE_COLOR_CLASSES with KnowledgeDBCategory instead */
export const KNOWLEDGE_CATEGORY_COLORS: Record<KnowledgeCategory, string> = {
  technique:    'bg-orange-100 text-orange-700',
  material:     'bg-blue-100 text-blue-700',
  quality:      'bg-green-100 text-green-700',
  troubleshoot: 'bg-red-100 text-red-700',
  safety:       'bg-yellow-100 text-yellow-700',
  general:      'bg-gray-100 text-gray-600',
}

/** DB-backed category from knowledge_categories table */
export interface KnowledgeDBCategory {
  id: string
  name: string
  color: string
  sort_order: number
}

/** Maps color key (stored in DB) → Tailwind badge classes */
export const KNOWLEDGE_COLOR_CLASSES: Record<string, string> = {
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  red:    'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  gray:   'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
  pink:   'bg-pink-100 text-pink-700',
}

/** Dot preview color (for color picker UI) — uses inline style */
export const KNOWLEDGE_COLOR_HEX: Record<string, string> = {
  orange: '#f97316',
  blue:   '#3b82f6',
  green:  '#22c55e',
  red:    '#ef4444',
  yellow: '#eab308',
  gray:   '#6b7280',
  purple: '#a855f7',
  pink:   '#ec4899',
}

export type ProjectStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export type PayrollStatus = 'draft' | 'confirmed' | 'paid'

export type ExpenseCategory = 'material' | 'tool' | 'transportation' | 'other'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  created_at: string
}

export interface Worker {
  id: string
  profile_id: string
  daily_rate: number
  overtime_rate: number
  bank_account: string | null
  notes: string | null
  is_active: boolean
  profile?: Profile
}

export interface Customer {
  id: string
  name: string
  contact_person: string | null
  phone: string | null
  address: string | null
  tax_id: string | null
  notes: string | null
  created_at: string
}

export interface Project {
  id: string
  customer_id: string
  name: string
  address: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  contract_amount: number | null
  description: string | null
  created_at: string
  customer?: Customer
}

export interface ProjectWorker {
  id: string
  project_id: string
  worker_id: string
  assigned_date: string
  worker?: Worker
  project?: Project
}

export interface TimeEntry {
  id: string
  worker_id: string
  project_id: string
  work_date: string
  regular_days: number
  overtime_hours: number
  transportation_fee: number
  meal_fee: number
  advance_payment: number
  subsidy: number
  other_fee: number
  work_progress: string | null
  submitted_at: string
  approved_by: string | null
  worker?: Worker
  project?: Project
}

export interface Expense {
  id: string
  project_id: string
  date: string
  category: ExpenseCategory
  amount: number
  description: string | null
  receipt_url: string | null
  created_by: string
  project?: Project
}

export interface KnowledgeTip {
  id: string
  worker_id: string
  project_id: string | null
  title: string
  content: string
  reason: string | null
  /** Legacy slug value (technique / material / …). Use knowledge_category for display. */
  category: string
  category_id: string | null
  knowledge_category?: KnowledgeDBCategory | null
  image_url: string | null
  created_at: string
  worker?: { profile?: { full_name: string } }
  project?: { name: string } | null
  knowledge_comments?: KnowledgeComment[]
}

export interface KnowledgeComment {
  id: string
  tip_id: string
  worker_id: string
  content: string
  created_at: string
  worker?: { profile?: { full_name: string } }
}

export interface PayrollRecord {
  id: string
  worker_id: string
  period_start: string
  period_end: string
  regular_days: number
  overtime_hours: number
  regular_amount: number
  overtime_amount: number
  transportation_total: number
  meal_total: number
  advance_total: number
  subsidy_total: number
  other_total: number
  deduction_amount: number
  net_amount: number
  status: PayrollStatus
  confirmed_at: string | null
  notes: string | null
  worker?: Worker
}
