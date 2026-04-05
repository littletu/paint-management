-- Add optional detail fields to knowledge_tips
ALTER TABLE knowledge_tips
  ADD COLUMN caution       text,   -- 有什麼要特別注意的？
  ADD COLUMN numeric_detail text,  -- 數字細節
  ADD COLUMN product_brand  text;  -- 用什麼品牌的產品？
