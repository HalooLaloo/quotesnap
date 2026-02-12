-- Track payment reminders sent to clients
ALTER TABLE qs_invoices ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE qs_invoices ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;
