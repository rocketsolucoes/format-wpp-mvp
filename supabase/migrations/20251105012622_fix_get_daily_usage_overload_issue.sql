/*
  # Fix get_daily_usage Function Overload Issue

  ## Problem
  Multiple versions of get_daily_usage function exist causing ambiguity

  ## Solution
  - Drop all versions of the function
  - Create a single clean version with proper defaults
*/

-- Drop all versions of get_daily_usage
DROP FUNCTION IF EXISTS get_daily_usage(uuid);
DROP FUNCTION IF EXISTS get_daily_usage(uuid, integer);

-- Recreate single version with proper signature
CREATE FUNCTION get_daily_usage(
  p_user_id uuid, 
  p_days_back integer DEFAULT 30
)
RETURNS TABLE (
  date date,
  format_count bigint,
  token_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    created_at::date as date,
    COUNT(*)::bigint as format_count,
    COALESCE(SUM(tokens_used), 0)::bigint as token_count
  FROM formatting_history
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days_back || ' days')::interval
  GROUP BY created_at::date
  ORDER BY date DESC;
END;
$$;