-- Add FCM push notification token column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
