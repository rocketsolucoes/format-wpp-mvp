/*
  # Fix Formatting Prompts RLS Policies
  
  1. Purpose
    - Fix RLS policies to properly allow admin updates
    - Separate policies for different operations
    - Add proper WITH CHECK clauses for INSERT and UPDATE
    
  2. Changes
    - Drop existing broad "ALL" policy
    - Create specific policies for SELECT, INSERT, UPDATE, DELETE
    - Each policy checks is_admin for modification operations
    
  3. Security
    - Public can read active prompts (SELECT with is_active = true)
    - Only admins can INSERT, UPDATE, DELETE
    - WITH CHECK ensures data integrity on modifications
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read active prompts" ON formatting_prompts;
DROP POLICY IF EXISTS "Only admins can modify prompts" ON formatting_prompts;

-- Create specific SELECT policy for public to read active prompts
CREATE POLICY "Public can read active prompts"
  ON formatting_prompts
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create SELECT policy for admins to read all prompts
CREATE POLICY "Admins can read all prompts"
  ON formatting_prompts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create INSERT policy for admins
CREATE POLICY "Admins can insert prompts"
  ON formatting_prompts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create UPDATE policy for admins
CREATE POLICY "Admins can update prompts"
  ON formatting_prompts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete prompts"
  ON formatting_prompts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
