-- Tag groups (e.g. 施工項目, 現場狀況)
CREATE TABLE knowledge_tag_groups (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Tags within each group
CREATE TABLE knowledge_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   uuid NOT NULL REFERENCES knowledge_tag_groups(id) ON DELETE CASCADE,
  label      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS: read by all authenticated, write by admin only
ALTER TABLE knowledge_tag_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_tags        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ktg_read"  ON knowledge_tag_groups FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "ktg_admin" ON knowledge_tag_groups FOR ALL    USING (is_admin());
CREATE POLICY "kt_read"   ON knowledge_tags        FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "kt_admin"  ON knowledge_tags        FOR ALL    USING (is_admin());

-- Pre-populate from hardcoded defaults
WITH g1 AS (
  INSERT INTO knowledge_tag_groups (label, sort_order) VALUES ('施工項目', 1) RETURNING id
)
INSERT INTO knowledge_tags (group_id, label, sort_order)
SELECT g1.id, t.label, t.ord FROM g1,
  (VALUES ('水泥牆',1),('磁磚面',2),('木作面',3),('舊漆面',4),('矽酸面',5),
          ('石膏板',6),('外牆',7),('特殊漆',8),('水性漆',9),('油性漆',10)) AS t(label,ord);

WITH g2 AS (
  INSERT INTO knowledge_tag_groups (label, sort_order) VALUES ('現場狀況', 2) RETURNING id
)
INSERT INTO knowledge_tags (group_id, label, sort_order)
SELECT g2.id, t.label, t.ord FROM g2,
  (VALUES ('新作',1),('舊屋',2),('潮濕環境',3),('高樓層',4),
          ('壁癌',5),('裂縫',6),('問題牆面',7)) AS t(label,ord);
