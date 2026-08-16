-- Add manager role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager';

-- Helper: is current user admin or manager?
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Managers can read & insert customers
CREATE POLICY "customers_manager" ON customers
  FOR ALL USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- Managers can read & insert projects
CREATE POLICY "projects_manager" ON projects
  FOR ALL USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- Managers can read workers list (for project assignment UI)
CREATE POLICY "workers_manager_select" ON workers
  FOR SELECT USING (is_admin_or_manager());
