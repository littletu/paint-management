CREATE TABLE IF NOT EXISTS company_expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE company_expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage company expense categories"
  ON company_expense_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All users can read company expense categories"
  ON company_expense_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);
