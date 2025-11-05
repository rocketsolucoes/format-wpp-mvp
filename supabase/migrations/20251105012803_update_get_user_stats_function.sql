/*
  # Update get_user_stats Function

  ## Changes
  - Add this_month and last_month calculations
  - Rename total_formats to total_formatting to match frontend expectations
  - Keep backward compatibility with other fields
*/

-- Drop and recreate the function with updated return type
DROP FUNCTION IF EXISTS get_user_stats(uuid);

CREATE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE (
  total_formatting bigint,
  this_month bigint,
  last_month bigint,
  total_tokens bigint,
  avg_tokens numeric,
  favorite_style_id uuid,
  favorite_style_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_of_month date;
  v_start_of_last_month date;
  v_end_of_last_month date;
BEGIN
  -- Calculate date boundaries
  v_start_of_month := date_trunc('month', CURRENT_DATE);
  v_start_of_last_month := date_trunc('month', CURRENT_DATE - interval '1 month');
  v_end_of_last_month := v_start_of_month - interval '1 day';
  
  RETURN QUERY
  SELECT 
    -- Total formatting count (all time)
    COUNT(*)::bigint as total_formatting,
    
    -- This month count
    (
      SELECT COUNT(*)::bigint
      FROM formatting_history
      WHERE user_id = p_user_id
      AND created_at >= v_start_of_month
    ) as this_month,
    
    -- Last month count
    (
      SELECT COUNT(*)::bigint
      FROM formatting_history
      WHERE user_id = p_user_id
      AND created_at >= v_start_of_last_month
      AND created_at <= v_end_of_last_month
    ) as last_month,
    
    -- Total tokens used
    COALESCE(SUM(tokens_used), 0)::bigint as total_tokens,
    
    -- Average tokens per format
    COALESCE(AVG(tokens_used), 0)::numeric as avg_tokens,
    
    -- Most used style ID
    (
      SELECT fh.style_id
      FROM formatting_history fh
      WHERE fh.user_id = p_user_id AND fh.style_id IS NOT NULL
      GROUP BY fh.style_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as favorite_style_id,
    
    -- Most used style name
    (
      SELECT s.name
      FROM styles s
      WHERE s.id = (
        SELECT fh.style_id
        FROM formatting_history fh
        WHERE fh.user_id = p_user_id AND fh.style_id IS NOT NULL
        GROUP BY fh.style_id
        ORDER BY COUNT(*) DESC
        LIMIT 1
      )
    ) as favorite_style_name
  FROM formatting_history
  WHERE user_id = p_user_id;
END;
$$;