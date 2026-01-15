# 🚀 QUICK START - Aplicar Migrations em 5 Minutos

## PASSO 1: Abrir SQL Editor

Abra em nova aba: **https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/sql/new**

---

## PASSO 2: Executar Migration 1 (Remover Stripe)

**Cole e clique em RUN:**

```sql
-- Migration 1: Remove Stripe Structure
-- Drop views first (dependent objects)
DROP VIEW IF EXISTS stripe_user_orders;
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Drop tables (with CASCADE to remove dependent objects)
DROP TABLE IF EXISTS stripe_orders CASCADE;
DROP TABLE IF EXISTS stripe_subscriptions CASCADE;
DROP TABLE IF EXISTS stripe_customers CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS stripe_order_status;
DROP TYPE IF EXISTS stripe_subscription_status;
```

✅ Resultado esperado: `Success. No rows returned`

---

## PASSO 3: Executar Migration 2 (Criar Hotmart)

**Cole e clique em RUN:**

```sql
-- Migration 2: Create Hotmart Structure

-- =====================================================
-- HOTMART CUSTOMERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotmart_customers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  subscriber_code text NOT NULL UNIQUE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE hotmart_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Hotmart customer data"
  ON hotmart_customers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_hotmart_customers_user_id ON hotmart_customers(user_id);
CREATE INDEX idx_hotmart_customers_subscriber_code ON hotmart_customers(subscriber_code);

-- =====================================================
-- HOTMART SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotmart_subscriptions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id bigint REFERENCES hotmart_customers(id) NOT NULL,
  subscription_id text NOT NULL UNIQUE,
  plan_id text NOT NULL,
  status text NOT NULL,
  date_next_charge timestamptz,
  date_subscription_start timestamptz,
  date_subscription_end timestamptz,
  recurrency_period int,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE hotmart_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Hotmart subscriptions"
  ON hotmart_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM hotmart_customers WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_hotmart_subscriptions_customer_id ON hotmart_subscriptions(customer_id);
CREATE INDEX idx_hotmart_subscriptions_subscription_id ON hotmart_subscriptions(subscription_id);
CREATE INDEX idx_hotmart_subscriptions_status ON hotmart_subscriptions(status);

-- =====================================================
-- HOTMART TRANSACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS hotmart_transactions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  customer_id bigint REFERENCES hotmart_customers(id) NOT NULL,
  transaction text NOT NULL UNIQUE,
  purchase_date timestamptz NOT NULL,
  product_id text NOT NULL,
  product_name text,
  offer_code text,
  amount_total numeric(10,2) NOT NULL,
  currency text DEFAULT 'BRL' NOT NULL,
  status text NOT NULL,
  payment_type text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE hotmart_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Hotmart transactions"
  ON hotmart_transactions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM hotmart_customers WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_hotmart_transactions_customer_id ON hotmart_transactions(customer_id);
CREATE INDEX idx_hotmart_transactions_transaction ON hotmart_transactions(transaction);
CREATE INDEX idx_hotmart_transactions_status ON hotmart_transactions(status);
CREATE INDEX idx_hotmart_transactions_purchase_date ON hotmart_transactions(purchase_date DESC);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

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
```

✅ Resultado esperado: `Success. No rows returned`

---

## PASSO 4: Verificar Tabelas Criadas

**Cole e clique em RUN:**

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'hotmart%'
ORDER BY tablename;
```

✅ Resultado esperado: Deve mostrar 3 tabelas:
- hotmart_customers
- hotmart_subscriptions
- hotmart_transactions

---

## ✅ PRONTO!

Migrations aplicadas com sucesso!

**Próximo passo:** Me avise que terminou e eu vou validar tudo e preparar o deploy da Edge Function.
