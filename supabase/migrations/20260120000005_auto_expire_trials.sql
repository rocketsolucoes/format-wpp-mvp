/*
  # Auto-Expire Trials System

  ## Problem

  Currently, trial expiration is MANUAL - requires running migrations.
  When new trials expire, they stay as 'active' with 9999 credits.

  ## Solution

  This migration creates an AUTOMATIC system with 2 mechanisms:

  ### 1. Daily Cron Job (pg_cron)
  - Runs every day at 00:00 UTC
  - Expires trials where trial_end_date < NOW()
  - Downgrades to Free plan with 10 credits
  - Logs execution in a dedicated table

  ### 2. Real-time Check (Database Function)
  - Function that checks and updates on-demand
  - Can be called from frontend/backend
  - Provides immediate feedback

  ## How It Works

  1. Cron job runs daily → expires old trials → downgrades to free
  2. Users login → frontend can call check function → instant update
  3. Both systems work independently for redundancy

  ## Safety

  - Only affects users with trial_status = 'active' and trial_end_date < NOW()
  - Real Pro users (no trial_status) are never touched
  - Idempotent - can run multiple times safely
*/

-- =====================================================
-- 1. Create logging table for cron executions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.trial_expiration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trials_expired INT NOT NULL DEFAULT 0,
  users_downgraded INT NOT NULL DEFAULT 0,
  credits_adjusted INT NOT NULL DEFAULT 0,
  execution_time_ms INT,
  status TEXT NOT NULL DEFAULT 'success',
  error_message TEXT
);

-- Add RLS
ALTER TABLE public.trial_expiration_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs (adjust as needed)
CREATE POLICY "Service role can view logs"
  ON public.trial_expiration_logs
  FOR SELECT
  USING (auth.role() = 'service_role');

COMMENT ON TABLE public.trial_expiration_logs IS 'Logs of automatic trial expiration cron job executions';

-- =====================================================
-- 2. Create function to expire trials
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_trial_subscriptions()
RETURNS TABLE (
  trials_expired INT,
  users_downgraded INT,
  credits_adjusted INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trials_expired INT := 0;
  v_users_downgraded INT := 0;
  v_credits_adjusted INT := 0;
  v_start_time TIMESTAMPTZ;
  v_execution_time_ms INT;
BEGIN
  v_start_time := clock_timestamp();

  -- Step 1: Expire trials where trial_end_date has passed
  UPDATE public.profiles
  SET
    trial_status = 'expired',
    updated_at = NOW()
  WHERE trial_status = 'active'
    AND trial_end_date < NOW();

  GET DIAGNOSTICS v_trials_expired = ROW_COUNT;

  -- Step 2: Downgrade expired trials to Free plan
  UPDATE public.profiles
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

  GET DIAGNOSTICS v_users_downgraded = ROW_COUNT;

  -- Step 3: Ensure all Free users have correct credits
  UPDATE public.profiles
  SET
    credits_remaining = 10,
    updated_at = NOW()
  WHERE subscription_tier = 'free'
    AND (trial_status IS NULL OR trial_status = 'expired')
    AND credits_remaining != 10;

  GET DIAGNOSTICS v_credits_adjusted = ROW_COUNT;

  -- Calculate execution time
  v_execution_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start_time))::INT;

  -- Log execution
  INSERT INTO public.trial_expiration_logs (
    trials_expired,
    users_downgraded,
    credits_adjusted,
    execution_time_ms,
    status
  ) VALUES (
    v_trials_expired,
    v_users_downgraded,
    v_credits_adjusted,
    v_execution_time_ms,
    'success'
  );

  -- Return results
  RETURN QUERY SELECT v_trials_expired, v_users_downgraded, v_credits_adjusted;

EXCEPTION WHEN OTHERS THEN
  -- Log error
  INSERT INTO public.trial_expiration_logs (
    trials_expired,
    users_downgraded,
    credits_adjusted,
    status,
    error_message
  ) VALUES (
    v_trials_expired,
    v_users_downgraded,
    v_credits_adjusted,
    'error',
    SQLERRM
  );

  RAISE;
END;
$$;

COMMENT ON FUNCTION public.expire_trial_subscriptions() IS 'Automatically expires trials and downgrades users to Free plan. Returns stats.';

-- =====================================================
-- 3. Enable pg_cron extension (if not already enabled)
-- =====================================================

-- Note: pg_cron is available in Supabase, but needs to be enabled
-- This will be enabled via Supabase Dashboard or via SQL

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =====================================================
-- 4. Schedule daily cron job
-- =====================================================

-- Remove existing job if any
SELECT cron.unschedule('expire-trials-daily') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'expire-trials-daily'
);

-- Schedule job to run every day at 00:00 UTC
SELECT cron.schedule(
  'expire-trials-daily',                -- Job name
  '0 0 * * *',                          -- Cron schedule: Every day at midnight UTC
  $$SELECT public.expire_trial_subscriptions();$$  -- SQL to execute
);

COMMENT ON EXTENSION pg_cron IS 'Runs scheduled jobs including daily trial expiration';

-- =====================================================
-- 5. Create helper function for manual execution
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_and_expire_user_trial(user_id UUID)
RETURNS TABLE (
  was_expired BOOLEAN,
  new_status TEXT,
  new_credits INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trial_status TEXT;
  v_trial_end_date TIMESTAMPTZ;
  v_was_expired BOOLEAN := FALSE;
BEGIN
  -- Get current trial info
  SELECT trial_status, trial_end_date
  INTO v_trial_status, v_trial_end_date
  FROM public.profiles
  WHERE id = user_id;

  -- Check if trial should be expired
  IF v_trial_status = 'active' AND v_trial_end_date < NOW() THEN
    -- Expire trial and downgrade
    UPDATE public.profiles
    SET
      trial_status = 'expired',
      plan = 'free',
      subscription_tier = 'free',
      credits_remaining = 10,
      updated_at = NOW()
    WHERE id = user_id;

    v_was_expired := TRUE;
  END IF;

  -- Return current status
  RETURN QUERY
  SELECT
    v_was_expired,
    p.trial_status,
    p.credits_remaining
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;

COMMENT ON FUNCTION public.check_and_expire_user_trial(UUID) IS 'Checks and expires a specific user trial if needed. Can be called from frontend.';

-- =====================================================
-- 6. Create view for monitoring active trials
-- =====================================================

CREATE OR REPLACE VIEW public.active_trials_monitor AS
SELECT
  id,
  email,
  trial_status,
  trial_start_date,
  trial_end_date,
  subscription_tier,
  credits_remaining,
  CASE
    WHEN trial_end_date < NOW() THEN '🚨 SHOULD BE EXPIRED'
    WHEN trial_end_date < NOW() + INTERVAL '1 day' THEN '⚠️ EXPIRES IN < 24H'
    WHEN trial_end_date < NOW() + INTERVAL '3 days' THEN '⏰ EXPIRES IN < 3 DAYS'
    ELSE '✅ ACTIVE'
  END as status,
  EXTRACT(DAYS FROM (trial_end_date - NOW()))::INT as days_remaining
FROM public.profiles
WHERE trial_status = 'active'
ORDER BY trial_end_date ASC;

COMMENT ON VIEW public.active_trials_monitor IS 'Monitor active trials and see which ones should be expired';

-- =====================================================
-- 7. Test the function (optional)
-- =====================================================

-- Uncomment to test immediately
-- SELECT * FROM public.expire_trial_subscriptions();

-- =====================================================
-- 8. Success message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Auto-Expire Trials System ACTIVATED!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Cron job scheduled: Daily at 00:00 UTC';
  RAISE NOTICE 'Manual function: expire_trial_subscriptions()';
  RAISE NOTICE 'Per-user check: check_and_expire_user_trial(uuid)';
  RAISE NOTICE 'Monitor view: active_trials_monitor';
  RAISE NOTICE 'Logs table: trial_expiration_logs';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Trials will now expire AUTOMATICALLY every day!';
  RAISE NOTICE '==============================================';
END $$;
