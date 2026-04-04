-- =====================
-- 開銷分類 (動態，可自訂)
-- =====================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO expense_categories (name, sort_order) VALUES
  ('材料', 1),
  ('工具', 2),
  ('交通', 3),
  ('其他', 4)
ON CONFLICT DO NOTHING;

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage expense categories"
  ON expense_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Allow all authenticated users to read categories
CREATE POLICY "All users can read expense categories"
  ON expense_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =====================
-- 工程分類 (動態，可自訂)
-- =====================
CREATE TABLE IF NOT EXISTS project_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage project categories"
  ON project_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "All users can read project categories"
  ON project_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add category to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES project_categories(id) ON DELETE SET NULL;

-- Change expense.category from enum to text (to support custom categories)
ALTER TABLE expenses ALTER COLUMN category TYPE TEXT USING category::TEXT;
