/*
  # Fix Pro Plan Synchronization

  1. Changes
    - Update existing profiles with active subscription to pro plan
    - Create trigger to automatically sync plan with subscription_status
    - Ensure pro users have sufficient credits

  2. Security
    - No RLS changes needed
*/

-- Update existing profiles with active subscription to pro plan
UPDATE profiles 
SET 
  plan = 'pro',
  credits_remaining = CASE 
    WHEN credits_remaining < 1000 THEN 1000
    ELSE credits_remaining
  END
WHERE subscription_status = 'active' AND plan = 'free';

-- Create function to sync plan with subscription status
CREATE OR REPLACE FUNCTION sync_plan_with_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- If subscription becomes active, upgrade to pro
  IF NEW.subscription_status = 'active' AND OLD.subscription_status IS DISTINCT FROM 'active' THEN
    NEW.plan = 'pro';
    -- Ensure pro users have at least 1000 credits
    IF NEW.credits_remaining < 1000 THEN
      NEW.credits_remaining = 1000;
    END IF;
  END IF;

  -- If subscription is canceled or expired, downgrade to free
  IF NEW.subscription_status IN ('canceled', 'past_due', 'unpaid') 
     AND OLD.subscription_status = 'active' THEN
    NEW.plan = 'free';
    -- Free users get 15 credits
    IF NEW.credits_remaining > 15 THEN
      NEW.credits_remaining = 15;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-sync plan with subscription status
DROP TRIGGER IF EXISTS trigger_sync_plan_with_subscription ON profiles;
CREATE TRIGGER trigger_sync_plan_with_subscription
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
  EXECUTE FUNCTION sync_plan_with_subscription();
