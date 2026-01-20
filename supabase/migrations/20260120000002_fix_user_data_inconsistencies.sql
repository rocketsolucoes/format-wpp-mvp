/*
  # Fix User Data Inconsistencies

  ## Changes Made

  This migration fixes several data inconsistencies found after applying the trial system:

  1. Expire old trials and adjust credits
    - Users with trial_status = 'active' but trial_end_date in the past → set to 'expired'
    - Expired trial users with Pro plan → downgrade to Free with 10 credits
    - Active trial users keep Pro plan and 9999 credits

  2. Synchronize plan and subscription_tier columns
    - Ensure both columns always have the same value
    - Use subscription_tier as source of truth

  3. Fix Free plan users with incorrect credits
    - Free users should have exactly 10 credits (not 9999)
    - Only affects Free users without active trial

  ## Important Notes

  - Does not affect Pro users (subscription_tier = 'pro' and trial_status IS NULL)
  - Active trials remain untouched
  - Only fixes data inconsistencies, doesn't change business logic
*/

-- =====================================================
-- 1. Expire old trials that passed trial_end_date
-- =====================================================

UPDATE profiles
SET
  trial_status = 'expired',
  updated_at = NOW()
WHERE trial_status = 'active'
  AND trial_end_date < NOW();

-- =====================================================
-- 2. Downgrade expired trials to Free plan
-- =====================================================

UPDATE profiles
SET
  plan = 'free',
  subscription_tier = 'free',
  credits_remaining = 10,
  updated_at = NOW()
WHERE trial_status = 'expired'
  AND (subscription_tier = 'pro' OR plan = 'pro');

-- =====================================================
-- 3. Synchronize plan and subscription_tier columns
-- =====================================================

-- Use subscription_tier as source of truth
UPDATE profiles
SET
  plan = subscription_tier,
  updated_at = NOW()
WHERE plan != subscription_tier;

-- =====================================================
-- 4. Fix Free users with incorrect credits
-- =====================================================

-- Free users (without trial) should have exactly 10 credits
UPDATE profiles
SET
  credits_remaining = 10,
  updated_at = NOW()
WHERE (subscription_tier = 'free' OR plan = 'free')
  AND trial_status IS NULL
  AND credits_remaining != 10;

-- =====================================================
-- 5. Add constraint to keep plan and subscription_tier synchronized
-- =====================================================

-- Create a trigger to ensure plan and subscription_tier always match
CREATE OR REPLACE FUNCTION sync_plan_and_subscription_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Always keep plan = subscription_tier
  IF NEW.plan IS DISTINCT FROM NEW.subscription_tier THEN
    NEW.plan := NEW.subscription_tier;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_plan_and_subscription_tier_trigger ON profiles;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER sync_plan_and_subscription_tier_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_plan_and_subscription_tier();

-- Add comment
COMMENT ON FUNCTION sync_plan_and_subscription_tier() IS 'Ensures plan and subscription_tier columns always have the same value';
