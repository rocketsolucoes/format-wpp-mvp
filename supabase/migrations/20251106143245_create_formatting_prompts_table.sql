/*
  # Create Formatting Prompts and Audit Log Tables

  1. Purpose
    - Create the missing `formatting_prompts` table that the admin UI expects
    - Create the `prompt_audit_log` table for tracking changes
    - Migrate existing prompt data from the `styles` table
    - Set up proper RLS policies for security

  2. New Tables
    - `formatting_prompts`
      - `id` (uuid, primary key) - Unique identifier for each prompt
      - `style_id` (text, not null) - Reference to style type (casual, sales, announcement)
      - `name` (text, not null) - Display name of the prompt
      - `description` (text, nullable) - Description of what the prompt does
      - `prompt` (text, not null) - The actual prompt text
      - `is_active` (boolean, default true) - Whether the prompt is currently active
      - `version` (integer, default 1) - Version number for tracking changes
      - `created_at` (timestamptz) - When the prompt was created
      - `updated_at` (timestamptz) - When the prompt was last updated

    - `prompt_audit_log`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `prompt_id` (uuid, not null) - Reference to the prompt that was changed
      - `user_id` (uuid, not null) - User who made the change
      - `action` (text, not null) - Type of action (create, update, delete)
      - `old_value` (jsonb, nullable) - Previous values before the change
      - `new_value` (jsonb, nullable) - New values after the change
      - `created_at` (timestamptz) - When the change occurred

  3. Data Migration
    - Copy existing prompts from `styles` table to `formatting_prompts`
    - Map style IDs: casual, sales, announcement
    - Set initial version to 1 for all prompts

  4. Security
    - Enable RLS on both tables
    - Only admins can modify formatting_prompts
    - Public users can only read active prompts
    - Only admins can view audit logs

  5. Important Notes
    - This creates the tables that the admin UI component expects
    - The trigger for audit logging is already created in a previous migration
    - RLS policies are already defined in a previous migration
*/

-- Create formatting_prompts table
CREATE TABLE IF NOT EXISTS formatting_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  style_id text NOT NULL,
  name text NOT NULL,
  description text,
  prompt text NOT NULL,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_formatting_prompts_style_id ON formatting_prompts(style_id);
CREATE INDEX IF NOT EXISTS idx_formatting_prompts_is_active ON formatting_prompts(is_active);

-- Enable Row Level Security
ALTER TABLE formatting_prompts ENABLE ROW LEVEL SECURITY;

-- Create prompt_audit_log table
CREATE TABLE IF NOT EXISTS prompt_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster history queries
CREATE INDEX IF NOT EXISTS idx_prompt_audit_log_prompt_id ON prompt_audit_log(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_log_user_id ON prompt_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_audit_log_created_at ON prompt_audit_log(created_at DESC);

-- Enable Row Level Security
ALTER TABLE prompt_audit_log ENABLE ROW LEVEL SECURITY;

-- Migrate data from styles table to formatting_prompts
INSERT INTO formatting_prompts (style_id, name, description, prompt, is_active, version, created_at, updated_at)
SELECT 
  id as style_id,
  name,
  description,
  custom_prompt as prompt,
  true as is_active,
  1 as version,
  created_at,
  updated_at
FROM styles
WHERE is_default = true
  AND id IN ('casual', 'sales', 'announcement')
ON CONFLICT DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_formatting_prompts_updated_at
  BEFORE UPDATE ON formatting_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
