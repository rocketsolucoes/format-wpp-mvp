/*
  # Fix Profiles INSERT Policy

  1. Changes
    - Add INSERT policy for profiles table to allow authenticated users to create their own profile
    - This is required for user registration to work properly

  2. Security
    - Users can only insert their own profile (id = auth.uid())
    - Policy is restricted to authenticated users only
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create INSERT policy for profiles
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());