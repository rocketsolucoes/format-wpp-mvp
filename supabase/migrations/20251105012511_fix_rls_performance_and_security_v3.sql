/*
  # Fix RLS Performance and Security Issues

  ## Changes
  
  1. **RLS Policy Performance Optimization**
     - Replace `auth.uid()` with `(select auth.uid())` in all policies
     - This prevents re-evaluation of auth functions for each row
     - Improves query performance at scale
  
  2. **Function Security**
     - Add `SECURITY DEFINER` and set search_path for all functions
     - Prevents search path manipulation attacks
  
  3. **Index Cleanup**
     - Remove unused indexes to reduce overhead
  
  ## Tables Affected
  - profiles
  - formatting_history  
  - styles
  - subscriptions
  - invoices
  - stripe_customers
  - stripe_subscriptions
  - stripe_orders
*/

-- ============================================
-- 1. DROP AND RECREATE RLS POLICIES WITH OPTIMIZED AUTH CHECKS
-- ============================================

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- FORMATTING_HISTORY TABLE
DROP POLICY IF EXISTS "Users can view own history" ON formatting_history;
DROP POLICY IF EXISTS "Users can insert own history" ON formatting_history;
DROP POLICY IF EXISTS "Users can delete own history" ON formatting_history;

CREATE POLICY "Users can view own history"
  ON formatting_history
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own history"
  ON formatting_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own history"
  ON formatting_history
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- STYLES TABLE
DROP POLICY IF EXISTS "Users can view own and default styles" ON styles;
DROP POLICY IF EXISTS "Users can insert own styles" ON styles;
DROP POLICY IF EXISTS "Users can update own styles" ON styles;
DROP POLICY IF EXISTS "Users can delete own styles" ON styles;

CREATE POLICY "Users can view own and default styles"
  ON styles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) OR is_default = true);

CREATE POLICY "Users can insert own styles"
  ON styles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own styles"
  ON styles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own styles"
  ON styles
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- SUBSCRIPTIONS TABLE
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- INVOICES TABLE
DROP POLICY IF EXISTS "Users can view own invoices" ON invoices;

CREATE POLICY "Users can view own invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- STRIPE_CUSTOMERS TABLE
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;

CREATE POLICY "Users can view their own customer data"
  ON stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()) AND deleted_at IS NULL);

-- STRIPE_SUBSCRIPTIONS TABLE
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;

CREATE POLICY "Users can view their own subscription data"
  ON stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- STRIPE_ORDERS TABLE
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;

CREATE POLICY "Users can view their own order data"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id
      FROM stripe_customers
      WHERE user_id = (select auth.uid()) AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- ============================================
-- 2. FIX FUNCTION SECURITY - DROP CASCADE AND RECREATE
-- ============================================

-- Drop existing functions with CASCADE
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS reset_monthly_credits() CASCADE;
DROP FUNCTION IF EXISTS increment_style_usage(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_daily_usage(uuid, integer) CASCADE;

-- Recreate update_updated_at_column with security fixes
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate triggers for update_updated_at_column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_styles_updated_at
  BEFORE UPDATE ON styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Recreate handle_new_user with security fixes
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Recreate trigger for handle_new_user (if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Recreate reset_monthly_credits with security fixes
CREATE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    credits_remaining = CASE
      WHEN subscription_tier = 'free' THEN 15
      WHEN subscription_tier = 'pro' THEN 1000
      WHEN subscription_tier = 'enterprise' THEN 10000
      ELSE 15
    END,
    credits_reset_date = NOW() + INTERVAL '30 days'
  WHERE credits_reset_date <= NOW();
END;
$$;

-- Recreate increment_style_usage with security fixes
CREATE FUNCTION increment_style_usage(p_style_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE styles
  SET usage_count = usage_count + 1
  WHERE id = p_style_id;
END;
$$;

-- Recreate get_user_stats with security fixes
CREATE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE (
  total_formats bigint,
  total_tokens bigint,
  avg_tokens numeric,
  favorite_style_id uuid,
  favorite_style_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_formats,
    COALESCE(SUM(tokens_used), 0)::bigint as total_tokens,
    COALESCE(AVG(tokens_used), 0)::numeric as avg_tokens,
    (
      SELECT fh.style_id
      FROM formatting_history fh
      WHERE fh.user_id = p_user_id AND fh.style_id IS NOT NULL
      GROUP BY fh.style_id
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as favorite_style_id,
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

-- Recreate get_daily_usage with security fixes
CREATE FUNCTION get_daily_usage(p_user_id uuid, p_days_back integer DEFAULT 30)
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

-- ============================================
-- 3. DROP UNUSED INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_formatting_history_created_at;
DROP INDEX IF EXISTS idx_formatting_history_style_id;
DROP INDEX IF EXISTS idx_styles_user_id;
DROP INDEX IF EXISTS idx_styles_is_default;
DROP INDEX IF EXISTS idx_styles_usage_count;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_subscriptions_stripe_customer_id;
DROP INDEX IF EXISTS idx_invoices_user_id;