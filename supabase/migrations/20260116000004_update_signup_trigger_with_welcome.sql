/*
  # Update Signup Trigger to Include Welcome Flag
  
  1. Changes
    - Add trial_welcome_shown field to signup trigger
    - Ensures new trial users see welcome modal
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate function with trial_welcome_shown
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
    trial_welcome_shown,
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
    false, -- Show welcome modal for new trial users
    CASE WHEN has_previous_trial THEN 30 ELSE 9999 END
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

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new users with 7-day Pro trial. Shows welcome modal. Prevents multiple trials per email.';
