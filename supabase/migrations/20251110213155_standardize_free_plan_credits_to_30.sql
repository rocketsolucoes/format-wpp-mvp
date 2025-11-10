/*
  # Standardize Free Plan Credits to 30

  ## Changes Made
  
  This migration standardizes the free plan credits from inconsistent values (15, 100) to 30 credits per month.
  
  1. Updates
    - Changes default value for `credits_remaining` column in `profiles` table to 30
    - Updates all existing free plan users to have 30 credits if they currently have more than 30
  
  2. Security
    - No RLS policy changes needed
    - Maintains existing security structure
  
  ## Important Notes
  
  - This migration ensures consistency across the application
  - Only affects free plan users
  - Pro and enterprise users remain unaffected (they have unlimited credits)
*/

-- Update default value for credits_remaining in profiles table
ALTER TABLE profiles 
ALTER COLUMN credits_remaining SET DEFAULT 30;

-- Update existing free plan users to have 30 credits as the maximum
-- This ensures users don't have inflated credit counts from the old system
UPDATE profiles
SET credits_remaining = 30
WHERE (subscription_tier = 'free' OR plan = 'free')
AND credits_remaining > 30;
