/*
  # Add Trial System
  
  1. New Columns
    - trial_status: Tracks trial state (null, 'active', 'expired', 'converted')
    - trial_start_date: When trial started
    - trial_end_date: When trial expires (start + 7 days)
    - trial_notification_sent: Flag for expiration notification
  
  2. Indexes
    - Index on trial_status for efficient queries
    - Index on trial_end_date for expiration checks
  
  3. Notes
    - Only new users will get trial (existing users unaffected)
    - Trial is activated automatically on signup
    - One trial per email (enforced in signup trigger)
*/

-- Add trial columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_status text DEFAULT NULL 
  CHECK (trial_status IN (NULL, 'active', 'expired', 'converted'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start_date timestamptz DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date timestamptz DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_notification_sent boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_status ON profiles(trial_status);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active_expiring ON profiles(trial_status, trial_end_date) 
  WHERE trial_status = 'active';

-- Add comments for documentation
COMMENT ON COLUMN profiles.trial_status IS 'Trial status: null (no trial), active (trial running), expired (trial ended), converted (user paid during trial)';
COMMENT ON COLUMN profiles.trial_start_date IS 'Date when trial started';
COMMENT ON COLUMN profiles.trial_end_date IS 'Date when trial expires (start + 7 days)';
COMMENT ON COLUMN profiles.trial_notification_sent IS 'Flag to track if expiration notification was sent';
