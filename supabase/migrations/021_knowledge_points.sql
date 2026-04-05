-- Add approval status to knowledge_tips
ALTER TABLE knowledge_tips
  ADD COLUMN status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- All previously published tips are considered approved
UPDATE knowledge_tips SET status = 'approved';

-- Add configurable points per category
ALTER TABLE knowledge_categories
  ADD COLUMN points int NOT NULL DEFAULT 10;
