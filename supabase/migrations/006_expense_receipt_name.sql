-- Add receipt_name to expenses for storing original filename
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_name TEXT;
