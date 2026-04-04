export type UserRole = 'admin' | 'worker'

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
