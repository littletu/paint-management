-- Payments (收款記錄) linked to a specific tax invoice
-- One tax invoice can have multiple installment payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_invoice_id UUID NOT NULL REFERENCES invoice_tax_invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoice payments"
  ON invoice_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM invoice_tax_invoices ti
    JOIN invoices i ON i.id = ti.invoice_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE ti.id = invoice_payments.tax_invoice_id AND p.role = 'admin'
  ));
