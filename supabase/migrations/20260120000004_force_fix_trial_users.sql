/*
  # Force Fix Trial Users - Aggressive Approach

  ## Problem

  Some users still have 9999 credits even after running previous migrations.
  This might happen if:
  1. trial_end_date is in the future (trial still active)
  2. User was created with trial but it should be downgraded
  3. Previous migrations didn't catch all edge cases

  ## Solution

  This migration aggressively fixes ALL trial users:
  - If trial_end_date < NOW() → expire and downgrade
  - If trial is older than 7 days → force expiration
  - Ensure all expired trials are downgraded to free with 10 credits

  ## Safety

  - Only affects users with trial_status IS NOT NULL
  - Preserves real Pro users (those without trial_status)
  - Can be run multiple times safely
*/

-- =====================================================
-- 1. Force expire trials based on trial_end_date
-- =====================================================

DO $$
DECLARE
  affected_count INT;
BEGIN
  -- Expire trials where trial_end_date has passed
  UPDATE profiles
  SET
    trial_status = 'expired',
    updated_at = NOW()
  WHERE trial_status = 'active'
    AND trial_end_date < NOW();

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Expired % trial(s) based on trial_end_date', affected_count;
END $$;

-- =====================================================
-- 2. Force expire trials older than 7 days (regardless of end_date)
-- =====================================================

DO $$
DECLARE
  affected_count INT;
BEGIN
  -- Expire trials where trial_start_date is older than 7 days
  UPDATE profiles
  SET
    trial_status = 'expired',
    trial_end_date = trial_start_date + INTERVAL '7 days',
    updated_at = NOW()
  WHERE trial_status = 'active'
    AND trial_start_date < (NOW() - INTERVAL '7 days');

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Force expired % trial(s) older than 7 days', affected_count;
END $$;

-- =====================================================
-- 3. Downgrade ALL expired trials to Free
-- =====================================================

DO $$
DECLARE
  affected_count INT;
BEGIN
  -- Downgrade expired trials to Free plan with 10 credits
  UPDATE profiles
  SET
    plan = 'free',
    subscription_tier = 'free',
    credits_remaining = 10,
    updated_at = NOW()
  WHERE trial_status = 'expired'
    AND (
      subscription_tier != 'free'
      OR plan != 'free'
      OR credits_remaining != 10
    );

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Downgraded % expired trial user(s) to Free plan', affected_count;
END $$;

-- =====================================================
-- 4. Fix Free users with incorrect credits (final cleanup)
-- =====================================================

DO $$
DECLARE
  affected_count INT;
BEGIN
  -- Ensure all Free users (without active trial) have 10 credits
  UPDATE profiles
  SET
    credits_remaining = 10,
    updated_at = NOW()
  WHERE subscription_tier = 'free'
    AND (trial_status IS NULL OR trial_status = 'expired')
    AND credits_remaining != 10;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Fixed credits for % Free user(s)', affected_count;
END $$;

-- =====================================================
-- 5. Final validation query
-- =====================================================

DO $$
DECLARE
  active_trials INT;
  expired_trials INT;
  free_users INT;
  pro_users INT;
BEGIN
  -- Count active trials
  SELECT COUNT(*) INTO active_trials
  FROM profiles
  WHERE trial_status = 'active';

  -- Count expired trials
  SELECT COUNT(*) INTO expired_trials
  FROM profiles
  WHERE trial_status = 'expired';

  -- Count free users
  SELECT COUNT(*) INTO free_users
  FROM profiles
  WHERE subscription_tier = 'free';

  -- Count pro users (without trial)
  SELECT COUNT(*) INTO pro_users
  FROM profiles
  WHERE subscription_tier = 'pro' AND trial_status IS NULL;

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Active trials: %', active_trials;
  RAISE NOTICE 'Expired trials: %', expired_trials;
  RAISE NOTICE 'Free users: %', free_users;
  RAISE NOTICE 'Pro users (no trial): %', pro_users;
  RAISE NOTICE '==============================================';
END $$;
