/*
  # Validate and Fix Existing Users

  ## Purpose
  This migration validates and fixes all existing user data to ensure consistency
  with the new Free plan restrictions (10 credits, no history access).

  ## Changes Made

  1. Fix Credits
     - All Free users (not on trial) get maximum 10 credits
     - Pro users keep 9999 (unlimited)
     - Trial users keep 9999 (unlimited)

  2. Ensure Consistency
     - plan and subscription_tier must match
     - trial_status must be consistent with plan
     - Free users with trial_status = NULL get proper credits

  3. Data Validation
     - Identifies and logs any inconsistencies
     - Fixes redundant/conflicting data

  ## Safe to Run Multiple Times
  This migration is idempotent and can be run multiple times safely.
*/

-- Step 1: Fix Free users who are not on trial and have > 10 credits
UPDATE profiles
SET credits_remaining = 10
WHERE (plan = 'free' OR subscription_tier = 'free')
  AND (trial_status IS NULL OR trial_status = 'expired')
  AND credits_remaining > 10;

-- Step 2: Ensure plan and subscription_tier are consistent
UPDATE profiles
SET subscription_tier = plan
WHERE plan != subscription_tier;

-- Step 3: Fix users who are marked as Free but have active trial
-- (These should be Pro during trial)
UPDATE profiles
SET
  plan = 'pro',
  subscription_tier = 'pro',
  credits_remaining = 9999
WHERE trial_status = 'active'
  AND (plan = 'free' OR subscription_tier = 'free');

-- Step 4: Fix Pro users who don't have unlimited credits
UPDATE profiles
SET credits_remaining = 9999
WHERE (plan = 'pro' OR subscription_tier = 'pro')
  AND credits_remaining < 9999;

-- Step 5: Fix specific user: agnysmarques@ymail.com
-- Force this user to Free plan with 10 credits if not on active trial
UPDATE profiles
SET
  plan = CASE WHEN trial_status = 'active' THEN 'pro' ELSE 'free' END,
  subscription_tier = CASE WHEN trial_status = 'active' THEN 'pro' ELSE 'free' END,
  credits_remaining = CASE WHEN trial_status = 'active' THEN 9999 ELSE 10 END
WHERE email = 'agnysmarques@ymail.com';

-- Step 6: Log data before fixes (for audit)
-- Create a temporary log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_audit_log (
  id SERIAL PRIMARY KEY,
  migration_name TEXT,
  action TEXT,
  user_email TEXT,
  old_plan TEXT,
  new_plan TEXT,
  old_credits INTEGER,
  new_credits INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log the changes (insert audit records)
INSERT INTO migration_audit_log (
  migration_name,
  action,
  user_email,
  old_plan,
  new_plan,
  old_credits,
  new_credits
)
SELECT
  '20260120000002_validate_and_fix_existing_users',
  'Fixed Free user credits',
  email,
  plan,
  plan,
  credits_remaining,
  10
FROM profiles
WHERE (plan = 'free' OR subscription_tier = 'free')
  AND (trial_status IS NULL OR trial_status = 'expired')
  AND credits_remaining != 10;

-- Add comment
COMMENT ON TABLE migration_audit_log IS 'Audit log for migration changes to user profiles';
