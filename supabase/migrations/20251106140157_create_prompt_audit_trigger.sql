/*
  # Create Prompt Audit Trigger
  
  1. Purpose
    - Automatically log all changes to formatting_prompts table
    - Track create, update, and delete operations
    - Store old and new values for comparison
    
  2. Changes
    - Create trigger function to log changes
    - Attach trigger to formatting_prompts table
    - Populate audit log automatically on any modification
    
  3. Security
    - Trigger runs with definer security
    - Uses auth.uid() to track who made the change
*/

-- Create function to log prompt changes
CREATE OR REPLACE FUNCTION log_prompt_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO prompt_audit_log (
      prompt_id,
      user_id,
      action,
      old_value,
      new_value,
      created_at
    ) VALUES (
      NEW.id,
      auth.uid(),
      'create',
      NULL,
      jsonb_build_object(
        'prompt', NEW.prompt,
        'name', NEW.name,
        'style_id', NEW.style_id,
        'version', NEW.version
      ),
      now()
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO prompt_audit_log (
      prompt_id,
      user_id,
      action,
      old_value,
      new_value,
      created_at
    ) VALUES (
      NEW.id,
      auth.uid(),
      'update',
      jsonb_build_object(
        'prompt', OLD.prompt,
        'name', OLD.name,
        'style_id', OLD.style_id,
        'version', OLD.version
      ),
      jsonb_build_object(
        'prompt', NEW.prompt,
        'name', NEW.name,
        'style_id', NEW.style_id,
        'version', NEW.version
      ),
      now()
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO prompt_audit_log (
      prompt_id,
      user_id,
      action,
      old_value,
      new_value,
      created_at
    ) VALUES (
      OLD.id,
      auth.uid(),
      'delete',
      jsonb_build_object(
        'prompt', OLD.prompt,
        'name', OLD.name,
        'style_id', OLD.style_id,
        'version', OLD.version
      ),
      NULL,
      now()
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS prompt_changes_trigger ON formatting_prompts;

-- Create trigger on formatting_prompts table
CREATE TRIGGER prompt_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON formatting_prompts
FOR EACH ROW
EXECUTE FUNCTION log_prompt_changes();

-- Add RLS policy for prompt_audit_log if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prompt_audit_log' 
    AND policyname = 'Admins can view audit log'
  ) THEN
    CREATE POLICY "Admins can view audit log"
      ON prompt_audit_log
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.is_admin = true
        )
      );
  END IF;
END $$;
