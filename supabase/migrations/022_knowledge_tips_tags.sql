-- Add tags array to knowledge_tips for AI context enrichment
ALTER TABLE knowledge_tips
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
