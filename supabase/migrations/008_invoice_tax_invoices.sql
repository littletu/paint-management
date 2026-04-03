-- Tax invoices (統一發票) issued against a 請款單
-- One 請款單 can have multiple tax invoices
CREATE TABLE IF NOT EXISTS invoice_tax_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tax_invoice_number TEXT NOT NULL,   -- 統一發票號碼
  tax_invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL,      -- 發票金額
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_tax_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tax invoices"
  ON invoice_tax_invoices FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
