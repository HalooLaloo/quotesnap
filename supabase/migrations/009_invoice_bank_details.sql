-- Store bank details per-invoice so contractor can use different accounts
ALTER TABLE qs_invoices ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE qs_invoices ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE qs_invoices ADD COLUMN IF NOT EXISTS bank_routing TEXT;
