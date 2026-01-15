/*
  # Hotmart Integration Schema

  This migration creates the database structure for Hotmart payment integration.

  ## New Tables:

  1. `hotmart_customers`
     - Links Supabase users to Hotmart subscribers
     - Stores subscriber_code (Hotmart unique identifier)
     - One-to-one relationship with auth.users

  2. `hotmart_subscriptions`
     - Manages subscription lifecycle
     - Tracks subscription status, dates, and plan information
     - Links to hotmart_customers

  3. `hotmart_transactions`
     - Records all purchase events
     - Stores transaction details, amounts, and status
     - Historical record of all payments

  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Users can only view their own data
*/

-- =====================================================
-- HOTMART CUSTOMERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotmart_customers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  subscriber_code text NOT NULL UNIQUE, -- Hotmart subscriber code
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE hotmart_customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own customer data
CREATE POLICY "Users can view their own Hotmart customer data"
  ON hotmart_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX idx_hotmart_customers_user_id ON hotmart_customers(user_id);
CREATE INDEX idx_hotmart_customers_subscriber_code ON hotmart_customers(subscriber_code);

-- =====================================================
-- HOTMART SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotmart_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id bigint REFERENCES hotmart_customers(id) NOT NULL,
  subscription_id text NOT NULL UNIQUE, -- Hotmart subscription ID
  plan_id text NOT NULL, -- Hotmart plan/product ID
  status text NOT NULL, -- active, canceled, suspended, etc.
  date_next_charge timestamptz,
  date_subscription_start timestamptz,
  date_subscription_end timestamptz,
  recurrency_period int, -- In days (e.g., 30 for monthly)
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE hotmart_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscriptions
CREATE POLICY "Users can view their own Hotmart subscriptions"
  ON hotmart_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM hotmart_customers WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_hotmart_subscriptions_customer_id ON hotmart_subscriptions(customer_id);
CREATE INDEX idx_hotmart_subscriptions_subscription_id ON hotmart_subscriptions(subscription_id);
CREATE INDEX idx_hotmart_subscriptions_status ON hotmart_subscriptions(status);

-- =====================================================
-- HOTMART TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotmart_transactions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id bigint REFERENCES hotmart_customers(id) NOT NULL,
  transaction text NOT NULL UNIQUE, -- Hotmart transaction ID
  purchase_date timestamptz NOT NULL,
  product_id text NOT NULL, -- Hotmart product ID
  product_name text,
  offer_code text, -- Hotmart offer/coupon code
  amount_total numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL' NOT NULL,
  status text NOT NULL, -- approved, refunded, canceled, etc.
  payment_type text, -- credit_card, pix, boleto, etc.
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE hotmart_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view their own Hotmart transactions"
  ON hotmart_transactions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM hotmart_customers WHERE user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_hotmart_transactions_customer_id ON hotmart_transactions(customer_id);
CREATE INDEX idx_hotmart_transactions_transaction ON hotmart_transactions(transaction);
CREATE INDEX idx_hotmart_transactions_status ON hotmart_transactions(status);
CREATE INDEX idx_hotmart_transactions_purchase_date ON hotmart_transactions(purchase_date DESC);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View for easy access to user's current subscription
CREATE VIEW hotmart_user_active_subscription WITH (security_invoker = true) AS
SELECT
  c.user_id,
  c.email,
  s.subscription_id,
  s.plan_id,
  s.status,
  s.date_next_charge,
  s.date_subscription_start,
  s.date_subscription_end
FROM hotmart_customers c
INNER JOIN hotmart_subscriptions s ON c.id = s.customer_id
WHERE c.user_id = auth.uid()
  AND s.status IN ('active', 'trialing');

GRANT SELECT ON hotmart_user_active_subscription TO authenticated;

-- =====================================================
-- UPDATE TRIGGERS
-- =====================================================

-- Trigger to automatically update updated_at on hotmart_customers
CREATE OR REPLACE FUNCTION update_hotmart_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hotmart_customers_updated_at
  BEFORE UPDATE ON hotmart_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_hotmart_customers_updated_at();

-- Trigger to automatically update updated_at on hotmart_subscriptions
CREATE OR REPLACE FUNCTION update_hotmart_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hotmart_subscriptions_updated_at
  BEFORE UPDATE ON hotmart_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_hotmart_subscriptions_updated_at();

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE hotmart_customers IS 'Links Supabase users to Hotmart subscribers';
COMMENT ON TABLE hotmart_subscriptions IS 'Manages Hotmart subscription lifecycle and status';
COMMENT ON TABLE hotmart_transactions IS 'Records all Hotmart purchase transactions and events';
