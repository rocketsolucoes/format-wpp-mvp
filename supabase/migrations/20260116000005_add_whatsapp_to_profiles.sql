/*
  # Add WhatsApp field to profiles table

  1. Changes
    - Add `whatsapp` column to `profiles` table
    - The field is optional (nullable) to not break existing users
    - Format: +55 11 99999-9999 (Brazilian phone format)

  2. Notes
    - WhatsApp is collected during signup but was not being stored
    - This migration adds the field to persist the data
*/

-- Add whatsapp column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp text;

-- Add index for faster queries (optional, for future features like search by phone)
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp);

-- Add comment for documentation
COMMENT ON COLUMN profiles.whatsapp IS 'User WhatsApp phone number in format +55 11 99999-9999';
