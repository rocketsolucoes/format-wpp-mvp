/*
  # Pro Users Unlimited Credits

  1. Changes
    - Create trigger to prevent credit deduction for pro/enterprise users
    - Pro users always maintain high credit count (9999 = unlimited)

  2. Notes
    - This ensures pro users never run out of credits
    - Backend will continue to check plan type, not credits
*/

-- Create function to maintain unlimited credits for pro users
CREATE OR REPLACE FUNCTION maintain_pro_credits()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is pro or enterprise, always set credits to 9999 (unlimited)
  IF NEW.plan IN ('pro', 'enterprise') THEN
    NEW.credits_remaining = 9999;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain unlimited credits
DROP TRIGGER IF EXISTS trigger_maintain_pro_credits ON profiles;
CREATE TRIGGER trigger_maintain_pro_credits
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (NEW.plan IN ('pro', 'enterprise'))
  EXECUTE FUNCTION maintain_pro_credits();

-- Update all current pro/enterprise users
UPDATE profiles 
SET credits_remaining = 9999
WHERE plan IN ('pro', 'enterprise');
