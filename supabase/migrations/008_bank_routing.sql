-- Add bank routing/sort code field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bank_routing TEXT;
