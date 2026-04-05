-- Create knowledge_categories table
CREATE TABLE knowledge_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  color       text NOT NULL DEFAULT 'gray',
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
CREATE POLICY "kc_read_all" ON knowledge_categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can insert / update / delete
CREATE POLICY "kc_admin_insert" ON knowledge_categories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "kc_admin_update" ON knowledge_categories
  FOR UPDATE USING (is_admin());

CREATE POLICY "kc_admin_delete" ON knowledge_categories
  FOR DELETE USING (is_admin());

-- Pre-populate with default categories (matching existing slugs)
INSERT INTO knowledge_categories (name, color, sort_order) VALUES
  ('施工技巧', 'orange',  1),
  ('材料知識', 'blue',    2),
  ('品質要點', 'green',   3),
  ('問題排解', 'red',     4),
  ('安全注意', 'yellow',  5),
  ('一般分享', 'gray',    6);

-- Add category_id FK column to knowledge_tips
ALTER TABLE knowledge_tips
  ADD COLUMN category_id uuid REFERENCES knowledge_categories(id) ON DELETE SET NULL;

-- Migrate existing data: map old slug values to the new UUIDs
UPDATE knowledge_tips kt
SET category_id = kc.id
FROM knowledge_categories kc
WHERE
  (kt.category = 'technique'    AND kc.name = '施工技巧') OR
  (kt.category = 'material'     AND kc.name = '材料知識') OR
  (kt.category = 'quality'      AND kc.name = '品質要點') OR
  (kt.category = 'troubleshoot' AND kc.name = '問題排解') OR
  (kt.category = 'safety'       AND kc.name = '安全注意') OR
  (kt.category = 'general'      AND kc.name = '一般分享');
