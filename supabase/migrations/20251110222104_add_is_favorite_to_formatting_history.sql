/*
  # Add is_favorite column to formatting_history table

  ## Overview
  This migration adds the ability for users to mark formatting history entries as favorites
  for quick access and organization.

  ## Changes Made

  ### 1. Schema Modifications
  - Add `is_favorite` boolean column to `formatting_history` table
    - Default value: `false`
    - Non-null constraint to ensure data integrity

  ### 2. RLS Policy Updates
  - Add UPDATE policy for `formatting_history` table
    - Allows authenticated users to update their own formatting history records
    - Enables toggling the `is_favorite` field

  ### 3. Performance Optimization
  - Create index on `is_favorite` column for filtering favorite records
  - Create composite index on (user_id, is_favorite, created_at) for efficient queries

  ## Important Notes
  - Existing records will have `is_favorite` set to `false` by default
  - Users can only update their own formatting history records
  - The UPDATE policy includes both USING and WITH CHECK clauses for security
*/

-- Add is_favorite column to formatting_history table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'formatting_history' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE formatting_history
    ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Add UPDATE policy for formatting_history table
DROP POLICY IF EXISTS "Users can update own history" ON formatting_history;

CREATE POLICY "Users can update own history"
  ON formatting_history
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Create index for filtering favorite records
CREATE INDEX IF NOT EXISTS idx_formatting_history_is_favorite
  ON formatting_history(is_favorite)
  WHERE is_favorite = true;

-- Create composite index for efficient filtering and sorting
CREATE INDEX IF NOT EXISTS idx_formatting_history_user_favorite_created
  ON formatting_history(user_id, is_favorite, created_at DESC);