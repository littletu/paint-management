ALTER TABLE workers
  ADD COLUMN IF NOT EXISTS payment_method TEXT
    CHECK (payment_method IN ('cash', 'transfer'))
    NOT NULL DEFAULT 'cash';
