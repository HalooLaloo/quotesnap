-- Invoices table
CREATE TABLE IF NOT EXISTS qs_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES qs_quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  vat_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_net DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_gross DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  due_date DATE,
  payment_terms TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Client info
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT
);

-- Add RLS policies
ALTER TABLE qs_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON qs_invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invoices"
  ON qs_invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON qs_invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON qs_invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Add invoice counter to profiles for generating invoice numbers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invoice_counter INTEGER DEFAULT 0;

-- Add business details to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_address TEXT;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qs_invoices_user_id ON qs_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_qs_invoices_token ON qs_invoices(token);
CREATE INDEX IF NOT EXISTS idx_qs_invoices_quote_id ON qs_invoices(quote_id);
