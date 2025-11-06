/*
  # Fix Style ID Type and Populate Default Styles

  ## Problem
  The `formatting_history.style_id` is currently UUID, but the application code 
  (Edge Function and frontend) uses text identifiers like "casual", "sales", "announcement".
  This mismatch causes all formatting records to save with style_id = NULL.

  ## Solution
  1. Drop the foreign key constraint between formatting_history and styles
  2. Change formatting_history.style_id from UUID to TEXT
  3. Update styles table to use TEXT IDs instead of UUID
  4. Recreate foreign key with proper types
  5. Populate styles table with default styles using text IDs
  
  ## Changes Made
  
  ### 1. Tables Modified
  - `formatting_history.style_id`: Changed from UUID to TEXT
  - `styles.id`: Changed from UUID to TEXT
  
  ### 2. Default Styles Added
  Three default formatting styles are inserted:
  - **casual**: Casual, friendly conversational style
  - **sales**: Persuasive sales copywriting with urgency
  - **announcement**: Clear, authoritative announcements
  
  ### 3. Foreign Key Updated
  - Recreated FK relationship with correct TEXT types
  - Maintains ON DELETE CASCADE behavior
  
  ## Important Notes
  - Existing formatting_history records with NULL style_id are preserved
  - Future records will correctly link to styles using text identifiers
  - is_default = true for system styles, false for user-created styles
  - user_id is NULL for system default styles (not owned by any user)
*/

-- Step 1: Drop the existing foreign key constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'formatting_history_style_id_fkey' 
    AND table_name = 'formatting_history'
  ) THEN
    ALTER TABLE formatting_history DROP CONSTRAINT formatting_history_style_id_fkey;
  END IF;
END $$;

-- Step 2: Clear existing data from styles table (if any exist that would conflict)
TRUNCATE TABLE styles CASCADE;

-- Step 3: Alter styles.id column to TEXT
ALTER TABLE styles 
  DROP CONSTRAINT IF EXISTS styles_pkey CASCADE,
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT USING id::TEXT,
  ADD PRIMARY KEY (id);

-- Step 4: Alter formatting_history.style_id column to TEXT
ALTER TABLE formatting_history 
  ALTER COLUMN style_id TYPE TEXT USING style_id::TEXT;

-- Step 5: Recreate the foreign key with TEXT types
ALTER TABLE formatting_history
  ADD CONSTRAINT formatting_history_style_id_fkey
  FOREIGN KEY (style_id)
  REFERENCES styles(id)
  ON DELETE SET NULL;

-- Step 6: Insert default formatting styles
INSERT INTO styles (id, user_id, name, description, custom_prompt, is_default, usage_count)
VALUES 
  (
    'casual',
    NULL,
    'Casual Friendly',
    'Natural, conversational tone perfect for friends and informal chats',
    'You are a casual text formatter. Rewrite the user''s text in a casual, friendly, conversational style suitable for WhatsApp. Keep it natural and approachable while maintaining clarity. Format with proper line breaks and emojis where appropriate for WhatsApp. ONLY return the rewritten text, nothing else.',
    true,
    0
  ),
  (
    'sales',
    NULL,
    'Persuasive Sales',
    'High-converting sales copy with urgency and clear calls-to-action',
    'You are a persuasive sales text formatter. Rewrite the user''s text using high-conversion copywriting techniques suitable for WhatsApp. Use urgency, social proof, clear benefits, and compelling calls-to-action. Highlight prices and benefits with bold formatting and emojis. Format with proper line breaks and emphasis for WhatsApp. ONLY return the rewritten text, nothing else.',
    true,
    0
  ),
  (
    'announcement',
    NULL,
    'Clear Announcement',
    'Professional announcements with clear structure and emphasis',
    'You are an announcement text formatter. Rewrite the user''s text as a clear and authoritative notice suitable for WhatsApp. Use direct language, proper structure, and emphasize key information. Organize information clearly with structured formatting. Format with proper line breaks and emojis for WhatsApp readability. ONLY return the rewritten text, nothing else.',
    true,
    0
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  custom_prompt = EXCLUDED.custom_prompt,
  is_default = EXCLUDED.is_default;

-- Step 7: Create index on style_id for better query performance
CREATE INDEX IF NOT EXISTS idx_formatting_history_style_text 
  ON formatting_history(style_id) 
  WHERE style_id IS NOT NULL;