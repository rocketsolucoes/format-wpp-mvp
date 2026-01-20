/*
  # Update Free Plan Credits to 10

  ## Changes Made

  This migration reduces the free plan credits from 30 to 10 credits per month
  to incentivize upgrades to Pro plan.

  1. Updates
    - Changes default value for `credits_remaining` column to 10
    - Updates signup trigger to give new free users 10 credits instead of 30
    - Updates all existing free plan users to have 10 credits (max)

  2. Reasoning
    - More restrictive Free plan encourages Pro upgrades
    - Maintains free tier as product trial
    - Pro users keep unlimited credits (9999)

  ## Important Notes

  - Only affects Free plan users
  - Pro and enterprise users remain unaffected (9999 = unlimited)
  - Trial users start with Pro (9999 credits) then downgrade to Free (10 credits) after 7 days
*/

-- Update default value for credits_remaining in profiles table
ALTER TABLE profiles
ALTER COLUMN credits_remaining SET DEFAULT 10;

-- Update the signup trigger to give new free users 10 credits instead of 30
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  has_previous_trial boolean;
BEGIN
  -- Check if this email already had a trial (abuse prevention)
  SELECT EXISTS(
    SELECT 1 FROM public.profiles
    WHERE email = NEW.email
    AND trial_status IS NOT NULL
  ) INTO has_previous_trial;

  -- Insert new profile with trial (if eligible)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    plan,
    subscription_tier,
    trial_status,
    trial_start_date,
    trial_end_date,
    credits_remaining
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- If email already had trial, start as free
    CASE WHEN has_previous_trial THEN 'free' ELSE 'pro' END,
    CASE WHEN has_previous_trial THEN 'free' ELSE 'pro' END,
    -- Only activate trial if no previous trial
    CASE WHEN has_previous_trial THEN NULL ELSE 'active' END,
    CASE WHEN has_previous_trial THEN NULL ELSE NOW() END,
    CASE WHEN has_previous_trial THEN NULL ELSE NOW() + INTERVAL '7 days' END,
    -- Free users get 10 credits, Pro/Trial users get 9999 (unlimited)
    CASE WHEN has_previous_trial THEN 10 ELSE 9999 END
  );

  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing free plan users to have maximum of 10 credits
-- This ensures users don't have inflated credit counts
UPDATE profiles
SET credits_remaining = 10
WHERE (subscription_tier = 'free' OR plan = 'free')
  AND trial_status IS NULL  -- Don't touch active trial users
  AND credits_remaining > 10;

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new users with 7-day Pro trial. Free users get 10 credits/month. Prevents multiple trials per email.';
