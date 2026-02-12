-- Add company registration number field (used in GB)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_reg_number TEXT;
