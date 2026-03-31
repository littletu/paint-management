-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUMS
-- =====================
CREATE TYPE user_role AS ENUM ('admin', 'worker');
CREATE TYPE project_status AS ENUM ('pending', 'active', 'completed', 'cancelled');
CREATE TYPE payroll_status AS ENUM ('draft', 'confirmed', 'paid');
CREATE TYPE expense_category AS ENUM ('material', 'tool', 'transportation', 'other');

-- =====================
-- PROFILES
-- =====================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'worker',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- WORKERS
-- =====================
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  overtime_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  bank_account TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- CUSTOMERS
-- =====================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- PROJECTS
-- =====================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  address TEXT,
  status project_status NOT NULL DEFAULT 'pending',
  start_date DATE,
  end_date DATE,
  contract_amount NUMERIC(12, 2),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- PROJECT WORKERS (Assignments)
-- =====================
CREATE TABLE project_workers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(project_id, worker_id)
);

-- =====================
-- TIME ENTRIES (Daily work log)
-- =====================
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  work_date DATE NOT NULL,
  regular_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(5, 2) NOT NULL DEFAULT 0,
  transportation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  meal_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  advance_payment NUMERIC(10, 2) NOT NULL DEFAULT 0,
  subsidy NUMERIC(10, 2) NOT NULL DEFAULT 0,
  other_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  work_progress TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES profiles(id),
  UNIQUE(worker_id, work_date, project_id)
);

-- =====================
-- EXPENSES (Project costs)
-- =====================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category expense_category NOT NULL DEFAULT 'other',
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  receipt_url TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================
-- PAYROLL RECORDS
-- =====================
CREATE TABLE payroll_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  regular_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  regular_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  overtime_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  transportation_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  meal_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  advance_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  subsidy_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  other_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deduction_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status payroll_status NOT NULL DEFAULT 'draft',
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(worker_id, period_start, period_end)
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_time_entries_worker_date ON time_entries(worker_id, work_date);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_payroll_worker_period ON payroll_records(worker_id, period_start, period_end);
CREATE INDEX idx_projects_customer ON projects(customer_id);
CREATE INDEX idx_project_workers_project ON project_workers(project_id);
CREATE INDEX idx_project_workers_worker ON project_workers(worker_id);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function: get worker id for current user
CREATE OR REPLACE FUNCTION my_worker_id()
RETURNS UUID AS $$
  SELECT id FROM workers WHERE profile_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES: users can read their own, admins read all
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid() OR is_admin());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (is_admin() OR id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid() OR is_admin());

-- WORKERS: admins full access, workers read own
CREATE POLICY "workers_admin" ON workers FOR ALL USING (is_admin());
CREATE POLICY "workers_self_select" ON workers FOR SELECT USING (profile_id = auth.uid());

-- CUSTOMERS: admin only
CREATE POLICY "customers_admin" ON customers FOR ALL USING (is_admin());

-- PROJECTS: admin full, workers see assigned projects
CREATE POLICY "projects_admin" ON projects FOR ALL USING (is_admin());
CREATE POLICY "projects_worker_select" ON projects FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_workers pw
    WHERE pw.project_id = projects.id AND pw.worker_id = my_worker_id()
  )
);

-- PROJECT_WORKERS: admin full, workers see own assignments
CREATE POLICY "pw_admin" ON project_workers FOR ALL USING (is_admin());
CREATE POLICY "pw_worker_select" ON project_workers FOR SELECT USING (worker_id = my_worker_id());

-- TIME_ENTRIES: admin full, workers manage own
CREATE POLICY "te_admin" ON time_entries FOR ALL USING (is_admin());
CREATE POLICY "te_worker_select" ON time_entries FOR SELECT USING (worker_id = my_worker_id());
CREATE POLICY "te_worker_insert" ON time_entries FOR INSERT WITH CHECK (worker_id = my_worker_id());
CREATE POLICY "te_worker_update" ON time_entries FOR UPDATE USING (worker_id = my_worker_id() AND approved_by IS NULL);

-- EXPENSES: admin only
CREATE POLICY "expenses_admin" ON expenses FOR ALL USING (is_admin());

-- PAYROLL: admin full, workers read own
CREATE POLICY "payroll_admin" ON payroll_records FOR ALL USING (is_admin());
CREATE POLICY "payroll_worker_select" ON payroll_records FOR SELECT USING (worker_id = my_worker_id());

-- =====================
-- TRIGGER: auto-create profile on user signup
-- =====================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'worker')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
