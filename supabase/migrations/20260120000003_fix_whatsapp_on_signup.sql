/*
  # Fix WhatsApp Field on Signup

  ## Problem

  The whatsapp field was not being saved during user signup because:
  1. Frontend tries to insert profile manually after trigger already created it
  2. Trigger doesn't capture whatsapp from raw_user_meta_data
  3. INSERT fails (duplicate key), frontend treats as "profile exists" and gives up

  ## Solution

  Update the signup trigger to capture whatsapp from raw_user_meta_data:
  - Check for 'whatsapp' in NEW.raw_user_meta_data
  - Save it to the whatsapp column on profile creation

  ## Important Notes

  - Frontend needs to be updated to pass whatsapp in signUp options.data
  - This migration only fixes the trigger, frontend changes needed separately
  - Existing users without whatsapp will need to update their profile manually
*/

-- =====================================================
-- Update signup trigger to capture whatsapp
-- =====================================================

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
    whatsapp,  -- NEW: Add whatsapp field
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
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NULL),  -- NEW: Extract from metadata
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

-- Update comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new users with 7-day Pro trial and WhatsApp field. Free users get 10 credits/month. Prevents multiple trials per email.';
