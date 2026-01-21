-- Migration: Add intent_mode column to formatting_history table
-- This allows tracking which intent mode was used for each formatting

-- Add intent_mode column to formatting_history
ALTER TABLE formatting_history
ADD COLUMN IF NOT EXISTS intent_mode TEXT;

-- Add comment to document the column
COMMENT ON COLUMN formatting_history.intent_mode IS 'Intent mode used for formatting: general, sales, or notice';

-- Create index for faster queries filtering by intent_mode
CREATE INDEX IF NOT EXISTS idx_formatting_history_intent_mode
ON formatting_history(intent_mode);

-- Update existing records to have 'general' as default (retroactive compatibility)
UPDATE formatting_history
SET intent_mode = 'general'
WHERE intent_mode IS NULL;
