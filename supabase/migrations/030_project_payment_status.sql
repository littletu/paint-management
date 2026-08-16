-- Add payment_status to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS payment_status TEXT
    CHECK (payment_status IN ('待送單','已送單','階段請款中','已開發票待入帳','入帳結案'))
    NOT NULL DEFAULT '待送單';
