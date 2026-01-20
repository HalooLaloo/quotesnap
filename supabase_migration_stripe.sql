-- QuoteSnap Stripe subscription fields
-- Run this in Supabase SQL Editor

-- Add Stripe fields to qs_profiles table
ALTER TABLE qs_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_qs_profiles_stripe_customer_id ON qs_profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_qs_profiles_subscription_status ON qs_profiles(subscription_status);

-- If qs_profiles doesn't exist, create it
-- (uncomment if needed)
/*
CREATE TABLE IF NOT EXISTS qs_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  subscription_current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE qs_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own profile" ON qs_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON qs_profiles
  FOR UPDATE USING (auth.uid() = id);
*/
