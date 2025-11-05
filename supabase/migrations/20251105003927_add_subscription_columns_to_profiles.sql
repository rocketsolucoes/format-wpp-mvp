/*
  # Add Subscription Columns to Profiles

  1. Changes
    - Add `subscription_tier` column to profiles table (default: 'free')
    - Add `subscription_status` column to profiles table (default: null)
    
  2. Notes
    - Existing users will default to 'free' tier
    - Status will be null for users without subscriptions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'free' NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN subscription_status text DEFAULT NULL;
  END IF;
END $$;
