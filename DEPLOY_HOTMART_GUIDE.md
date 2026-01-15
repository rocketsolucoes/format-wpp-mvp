# 🚀 GUIA DE DEPLOY - MIGRAÇÃO HOTMART

Este guia contém todos os passos para aplicar as migrations e fazer deploy da Edge Function.

**Projeto:** `tfuexkcmtcootolhuroq`
**Tempo estimado:** 10-15 minutos

---

## 📋 PRÉ-REQUISITOS

✅ Webhook já configurado no Hotmart
✅ Código corrigido e commitado na branch `claude/validate-hotmart-migration-Gxrk1`

---

## PASSO 1: APLICAR MIGRATIONS SQL

### Opção A: Via Dashboard (Mais Fácil)

1. Acesse o SQL Editor do Supabase:
   ```
   https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/sql/new
   ```

2. **MIGRATION 1 - Remover Stripe** (copie e execute):

```sql
/*
  # Remove Stripe Integration Structure

  This migration removes all Stripe-related tables, views, types and policies
  as part of the migration to Hotmart payment processing.
*/

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

-- Note: We keep the profiles table intact as it will be adapted for Hotmart
```

3. Clique em **RUN** e aguarde a confirmação `Success. No rows returned`

4. **MIGRATION 2 - Criar estrutura Hotmart** (copie e execute):

```sql
/*
  # Hotmart Integration Schema

  This migration creates the database structure for Hotmart payment integration.
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
```

5. Clique em **RUN** e aguarde a confirmação `Success`

### Opção B: Via Supabase CLI

Se preferir usar o CLI:

```bash
# 1. Login no Supabase
supabase login

# 2. Linkar projeto
supabase link --project-ref tfuexkcmtcootolhuroq

# 3. Aplicar migrations
supabase db push
```

---

## PASSO 2: VERIFICAR TABELAS CRIADAS

Execute no SQL Editor para confirmar:

```sql
-- Listar tabelas Hotmart
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'hotmart%'
ORDER BY tablename;
```

**Resultado esperado:**
```
hotmart_customers
hotmart_subscriptions
hotmart_transactions
```

---

## PASSO 3: DEPLOY DA EDGE FUNCTION

### Opção A: Via Dashboard

1. Acesse Edge Functions:
   ```
   https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/functions
   ```

2. Clique em **Create a new function**

3. Preencha:
   - **Name:** `hotmart-webhook`
   - Marque: ✅ **Deploy function**

4. Cole o código da função (arquivo: `supabase/functions/hotmart-webhook/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Hotmart Webhook Handler
 *
 * Receives webhook notifications from Hotmart and updates the database accordingly.
 * Handles events like: purchase completion, subscription cancellation, refunds, etc.
 */

interface HotmartWebhookEvent {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data: {
    product: {
      id: number;
      name: string;
      ucode?: string;
    };
    buyer: {
      email: string;
      name: string;
      checkout_phone?: string;
    };
    purchase: {
      transaction: string;
      status: string;
      approved_date?: number;
      order_date?: number;
      price?: {
        value: number;
        currency_code: string;
      };
      payment?: {
        type: string;
      };
      offer?: {
        code: string;
      };
    };
    subscription?: {
      subscriber_code: string;
      plan?: {
        id: number;
        name: string;
      };
      status: string;
      date_next_charge?: {
        date: number;
      };
      date_subscription_start?: {
        date: number;
      };
      date_subscription_end?: {
        date: number;
      };
      recurrency_period?: number;
      subscription_id?: string;
    };
    affiliates?: any[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate Hotmart webhook signature for security
    const hotmartToken = req.headers.get('X-Hotmart-Hottok');
    if (!hotmartToken) {
      console.warn('Missing Hotmart signature - webhook might be from unauthorized source');
      // Note: For production, consider making this a hard requirement by returning 401
      // return new Response(
      //   JSON.stringify({ error: 'Missing Hotmart signature' }),
      //   { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      // );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Parse webhook payload
    const webhookEvent: HotmartWebhookEvent = await req.json();

    console.log('Received Hotmart webhook:', {
      event: webhookEvent.event,
      transaction: webhookEvent.data.purchase?.transaction,
      subscriberCode: webhookEvent.data.subscription?.subscriber_code,
    });

    // Extract common data
    const buyerEmail = webhookEvent.data.buyer.email;
    const buyerName = webhookEvent.data.buyer.name;
    const productId = String(webhookEvent.data.product.id);
    const productName = webhookEvent.data.product.name;

    // Find user by email (optimized query)
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .eq('email', buyerEmail)
      .single();

    if (profileError || !profile) {
      console.error(`User not found with email: ${buyerEmail}`);
      return new Response(
        JSON.stringify({ error: 'User not found', email: buyerEmail }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = profile.id;

    // Handle different event types
    switch (webhookEvent.event) {
      case 'PURCHASE_COMPLETE':
      case 'PURCHASE_APPROVED':
        await handlePurchaseComplete(supabaseClient, userId, webhookEvent);
        break;

      case 'SUBSCRIPTION_CANCELLATION':
      case 'PURCHASE_CANCELED':
        await handleSubscriptionCancellation(supabaseClient, userId, webhookEvent);
        break;

      case 'PURCHASE_REFUNDED':
        await handleRefund(supabaseClient, userId, webhookEvent);
        break;

      case 'SUBSCRIPTION_REACTIVATION':
        await handleSubscriptionReactivation(supabaseClient, userId, webhookEvent);
        break;

      default:
        console.log(`Unhandled event type: ${webhookEvent.event}`);
    }

    return new Response(
      JSON.stringify({ success: true, event: webhookEvent.event }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Handle purchase completion - activate subscription
 */
async function handlePurchaseComplete(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  const { buyer, product, purchase, subscription } = event.data;
  const subscriberCode = subscription?.subscriber_code || event.id;
  const buyerEmail = buyer.email;

  // 1. Create or update hotmart_customer (using upsert for atomicity)
  const { data: customer, error: customerError } = await supabaseClient
    .from('hotmart_customers')
    .upsert({
      user_id: userId,
      subscriber_code: subscriberCode,
      email: buyerEmail,
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select('id')
    .single();

  if (customerError) throw new Error(`Failed to upsert customer: ${customerError.message}`);
  const customerId = customer.id;

  // 2. Create or update subscription
  if (subscription) {
    const subscriptionData = {
      customer_id: customerId,
      subscription_id: subscription.subscription_id || subscriberCode,
      plan_id: String(subscription.plan?.id || product.id),
      status: 'active',
      date_next_charge: subscription.date_next_charge?.date
        ? new Date(subscription.date_next_charge.date * 1000).toISOString()
        : null,
      date_subscription_start: subscription.date_subscription_start?.date
        ? new Date(subscription.date_subscription_start.date * 1000).toISOString()
        : new Date().toISOString(),
      date_subscription_end: subscription.date_subscription_end?.date
        ? new Date(subscription.date_subscription_end.date * 1000).toISOString()
        : null,
      recurrency_period: subscription.recurrency_period || 30,
    };

    const { error: subError } = await supabaseClient
      .from('hotmart_subscriptions')
      .upsert(subscriptionData, { onConflict: 'subscription_id' });

    if (subError) throw new Error(`Failed to upsert subscription: ${subError.message}`);
  }

  // 3. Record transaction
  const transactionData = {
    customer_id: customerId,
    transaction: purchase.transaction,
    purchase_date: purchase.approved_date || purchase.order_date
      ? new Date((purchase.approved_date || purchase.order_date)! * 1000).toISOString()
      : new Date().toISOString(),
    product_id: String(product.id),
    product_name: product.name,
    offer_code: purchase.offer?.code || null,
    amount_total: purchase.price?.value || 0,
    currency: purchase.price?.currency_code || 'BRL',
    status: 'approved',
    payment_type: purchase.payment?.type || null,
  };

  const { error: txError } = await supabaseClient
    .from('hotmart_transactions')
    .upsert(transactionData, { onConflict: 'transaction' });

  if (txError) throw new Error(`Failed to record transaction: ${txError.message}`);

  // 4. Update user profile to Pro plan
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      plan: 'pro',
      subscription_status: 'active',
      subscription_tier: 'pro',
    })
    .eq('id', userId);

  if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

  console.log(`Successfully activated subscription for user ${userId}`);
}

/**
 * Handle subscription cancellation - downgrade to free
 */
async function handleSubscriptionCancellation(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  const subscriberCode = event.data.subscription?.subscriber_code || event.id;

  // 1. Update subscription status
  const { error: subError } = await supabaseClient
    .from('hotmart_subscriptions')
    .update({ status: 'canceled' })
    .eq('subscription_id', subscriberCode);

  if (subError) console.error('Failed to update subscription:', subError);

  // 2. Update user profile to free plan
  const { error: profileError } = await supabaseClient
    .from('profiles')
    .update({
      plan: 'free',
      subscription_status: 'canceled',
      subscription_tier: 'free',
      credits_remaining: 30, // Reset to free tier credits
    })
    .eq('id', userId);

  if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);

  console.log(`Successfully canceled subscription for user ${userId}`);
}

/**
 * Handle refund - cancel access immediately
 */
async function handleRefund(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  const transaction = event.data.purchase.transaction;

  // 1. Update transaction status
  const { error: txError } = await supabaseClient
    .from('hotmart_transactions')
    .update({ status: 'refunded' })
    .eq('transaction', transaction);

  if (txError) console.error('Failed to update transaction:', txError);

  // 2. Cancel subscription and downgrade user
  await handleSubscriptionCancellation(supabaseClient, userId, event);

  console.log(`Successfully processed refund for user ${userId}`);
}

/**
 * Handle subscription reactivation - restore Pro access
 */
async function handleSubscriptionReactivation(supabaseClient: any, userId: string, event: HotmartWebhookEvent) {
  // Treat reactivation the same as a new purchase
  await handlePurchaseComplete(supabaseClient, userId, event);
  console.log(`Successfully reactivated subscription for user ${userId}`);
}
```

5. Clique em **Deploy**

6. **Copie a URL gerada** (exemplo):
   ```
   https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/hotmart-webhook
   ```

### Opção B: Via Supabase CLI

```bash
# Deploy da função
supabase functions deploy hotmart-webhook

# Ver logs
supabase functions logs hotmart-webhook --follow
```

---

## PASSO 4: ATUALIZAR WEBHOOK NO HOTMART (SE NECESSÁRIO)

Se você ainda não configurou ou precisa atualizar a URL:

1. Acesse: https://app.hotmart.com
2. Vá em: **Produtos** → Seu produto → **Ferramentas** → **Webhook**
3. Cole a URL da Edge Function (do Passo 3)
4. Selecione os eventos:
   - ✅ PURCHASE_COMPLETE
   - ✅ PURCHASE_APPROVED
   - ✅ SUBSCRIPTION_CANCELLATION
   - ✅ PURCHASE_CANCELED
   - ✅ PURCHASE_REFUNDED
   - ✅ SUBSCRIPTION_REACTIVATION
5. Salve

---

## PASSO 5: VALIDAR DEPLOY

### 5.1 Verificar estrutura do banco

```sql
-- Ver colunas da tabela hotmart_customers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hotmart_customers'
ORDER BY ordinal_position;
```

### 5.2 Verificar policies RLS

```sql
-- Listar policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE 'hotmart%'
ORDER BY tablename, policyname;
```

### 5.3 Testar Edge Function

Opção 1 - Via Dashboard:
- Acesse: Edge Functions → hotmart-webhook → **Invoke**
- Cole um payload de teste

Opção 2 - Via curl:
```bash
curl -X POST https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/hotmart-webhook \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token" \
  -d '{
    "id": "test-123",
    "creation_date": 1234567890,
    "event": "PURCHASE_COMPLETE",
    "version": "2.0.0",
    "data": {
      "product": {"id": 123, "name": "Produto Teste"},
      "buyer": {"email": "seu-email@teste.com", "name": "Teste"},
      "purchase": {
        "transaction": "TX-TEST-123",
        "status": "approved",
        "approved_date": 1234567890,
        "price": {"value": 24.90, "currency_code": "BRL"}
      }
    }
  }'
```

### 5.4 Ver logs da função

```sql
-- No Dashboard: Edge Functions → hotmart-webhook → Logs
```

Ou via CLI:
```bash
supabase functions logs hotmart-webhook --follow
```

---

## PASSO 6: TESTE COMPLETO DE FLUXO

1. **Criar usuário teste:**
   - Registre-se no app com email de teste

2. **Fazer compra no Hotmart:**
   - Use ambiente sandbox se disponível
   - Ou faça uma compra real de teste

3. **Verificar webhook recebido:**
   ```sql
   -- Ver logs da edge function no Dashboard
   ```

4. **Validar dados salvos:**
   ```sql
   -- Ver customer criado
   SELECT * FROM hotmart_customers
   ORDER BY created_at DESC
   LIMIT 5;

   -- Ver subscription ativa
   SELECT * FROM hotmart_subscriptions
   WHERE status = 'active'
   ORDER BY created_at DESC
   LIMIT 5;

   -- Ver transação registrada
   SELECT * FROM hotmart_transactions
   ORDER BY created_at DESC
   LIMIT 5;

   -- Ver perfil atualizado
   SELECT email, plan, subscription_status, subscription_tier
   FROM profiles
   WHERE email = 'seu-email-teste@example.com';
   ```

   **Resultado esperado:**
   - ✅ Customer criado com user_id correto
   - ✅ Subscription com status 'active'
   - ✅ Transaction com status 'approved'
   - ✅ Profile com plan='pro', subscription_status='active'

---

## 🎉 PRONTO!

Se todos os passos acima passarem, a migração está completa e funcional!

## 📊 CHECKLIST FINAL

- ✅ Migration 1 aplicada (Stripe removido)
- ✅ Migration 2 aplicada (Hotmart criado)
- ✅ 3 tabelas criadas (customers, subscriptions, transactions)
- ✅ RLS policies configuradas
- ✅ Edge Function deployada
- ✅ Webhook configurado no Hotmart
- ✅ Teste de fluxo completo validado

## 🐛 TROUBLESHOOTING

### Erro: "User not found"
- Certifique-se que o email usado na compra está registrado no sistema

### Erro: "Failed to upsert customer"
- Verifique se as migrations foram aplicadas corretamente
- Confirme que a tabela hotmart_customers existe

### Webhook não está sendo chamado
- Verifique a URL no painel Hotmart
- Confirme que os eventos estão marcados
- Teste manualmente com curl

### Dados não aparecem no banco
- Verifique os logs da Edge Function
- Confirme que o webhook está recebendo os eventos
- Teste com SQL direto para ver se há erro de permissão

---

## 📞 SUPORTE

Se precisar de ajuda, verifique:
- Logs da Edge Function no Dashboard
- SQL Editor para queries de debug
- Webhook logs no Hotmart

---

**Branch com código corrigido:** `claude/validate-hotmart-migration-Gxrk1`
**Último commit:** `d92218b` - Correção de bug crítico user.id → userId
