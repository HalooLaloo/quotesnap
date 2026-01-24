-- Add CASCADE DELETE to all user-related foreign keys
-- When a user is deleted from auth.users, all their data will be automatically deleted

-- profiles table
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- qs_quote_requests table
ALTER TABLE qs_quote_requests DROP CONSTRAINT IF EXISTS qs_quote_requests_user_id_fkey;
ALTER TABLE qs_quote_requests ADD CONSTRAINT qs_quote_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- qs_quotes table
ALTER TABLE qs_quotes DROP CONSTRAINT IF EXISTS qs_quotes_user_id_fkey;
ALTER TABLE qs_quotes ADD CONSTRAINT qs_quotes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- qs_invoices table
ALTER TABLE qs_invoices DROP CONSTRAINT IF EXISTS qs_invoices_user_id_fkey;
ALTER TABLE qs_invoices ADD CONSTRAINT qs_invoices_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
