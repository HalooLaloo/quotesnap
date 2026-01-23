-- Add viewed_at column to track when client first viewed the quote
ALTER TABLE qs_quotes ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_qs_quotes_viewed_at ON qs_quotes(viewed_at);
