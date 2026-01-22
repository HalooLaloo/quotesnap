-- Add country and currency to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add currency to quotes (stored per-document for historical accuracy)
ALTER TABLE qs_quotes ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN';

-- Add currency to invoices
ALTER TABLE qs_invoices ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PLN';

-- Update default currency based on existing data (PLN for now since all existing data is Polish)
-- New users will get currency based on their selected country
