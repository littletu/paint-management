-- Payment statuses table (DB-backed, replaces hardcoded CHECK)
CREATE TABLE IF NOT EXISTS payment_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  sort_order INT NOT NULL DEFAULT 0
);

-- Seed defaults
INSERT INTO payment_statuses (label, color, sort_order) VALUES
  ('待送單',        'gray',   1),
  ('已送單',        'blue',   2),
  ('階段請款中',    'orange', 3),
  ('已開發票待入帳','purple', 4),
  ('入帳結案',      'green',  5);

-- RLS
ALTER TABLE payment_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_statuses_admin"  ON payment_statuses FOR ALL    USING (is_admin());
CREATE POLICY "payment_statuses_select" ON payment_statuses FOR SELECT USING (true);

-- Drop hardcoded CHECK on projects so labels can be freely managed
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_payment_status_check;
