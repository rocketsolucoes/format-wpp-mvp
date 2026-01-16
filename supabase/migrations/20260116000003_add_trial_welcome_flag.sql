/*
  # Add Trial Welcome Flag
  
  1. New Column
    - trial_welcome_shown: Boolean flag to track if welcome modal was shown
  
  2. Purpose
    - Controls display of welcome modal (show only once per user)
    - Defaults to false for new users
    - Set to true after modal is shown
*/

-- Add trial_welcome_shown column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_welcome_shown boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.trial_welcome_shown IS 'Flag to track if trial welcome modal was shown to user';

-- Update existing trial users to not show welcome (they already started)
UPDATE profiles 
SET trial_welcome_shown = true 
WHERE trial_status = 'active' AND trial_welcome_shown = false;
