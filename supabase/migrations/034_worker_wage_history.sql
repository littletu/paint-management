CREATE TABLE worker_wage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  daily_rate NUMERIC(10, 2) NOT NULL,
  overtime_rate NUMERIC(10, 2) NOT NULL,
  effective_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wage_history_worker ON worker_wage_history(worker_id, effective_date DESC);

ALTER TABLE worker_wage_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wage_history_admin" ON worker_wage_history FOR ALL USING (is_admin());
