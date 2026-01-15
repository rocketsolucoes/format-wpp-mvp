-- =====================================================
-- QUERIES DE MONITORAMENTO - Sistema Hotmart
-- =====================================================
-- Execute no SQL Editor para monitorar o sistema
-- https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/sql/new

-- =====================================================
-- DASHBOARD GERAL
-- =====================================================

-- 📊 Visão Geral do Sistema
SELECT
  'Total Customers' as metric,
  COUNT(*) as value
FROM hotmart_customers
UNION ALL
SELECT
  'Active Subscriptions',
  COUNT(*)
FROM hotmart_subscriptions
WHERE status = 'active'
UNION ALL
SELECT
  'Canceled Subscriptions',
  COUNT(*)
FROM hotmart_subscriptions
WHERE status = 'canceled'
UNION ALL
SELECT
  'Total Transactions',
  COUNT(*)
FROM hotmart_transactions
UNION ALL
SELECT
  'Approved Transactions',
  COUNT(*)
FROM hotmart_transactions
WHERE status = 'approved'
UNION ALL
SELECT
  'Refunded Transactions',
  COUNT(*)
FROM hotmart_transactions
WHERE status = 'refunded'
UNION ALL
SELECT
  'Pro Users',
  COUNT(*)
FROM profiles
WHERE plan = 'pro';

-- =====================================================
-- ASSINATURAS ATIVAS
-- =====================================================

-- 📋 Lista de todas as assinaturas ativas
SELECT
  p.email,
  p.full_name,
  p.plan,
  p.subscription_status,
  s.subscription_id,
  s.plan_id,
  s.date_subscription_start,
  s.date_next_charge,
  s.recurrency_period,
  CASE
    WHEN s.date_next_charge IS NULL THEN 'Sem renovação'
    WHEN s.date_next_charge < NOW() THEN '⚠️ Vencida'
    WHEN s.date_next_charge < NOW() + INTERVAL '7 days' THEN '⚠️ Vence em breve'
    ELSE '✅ Ativa'
  END as status_label
FROM profiles p
JOIN hotmart_customers c ON p.id = c.user_id
JOIN hotmart_subscriptions s ON c.id = s.customer_id
WHERE s.status = 'active'
ORDER BY s.date_next_charge ASC NULLS LAST;

-- =====================================================
-- TRANSAÇÕES RECENTES
-- =====================================================

-- 💰 Últimas 20 transações
SELECT
  t.purchase_date,
  p.email,
  t.product_name,
  t.amount_total,
  t.currency,
  t.status,
  t.payment_type,
  t.transaction
FROM hotmart_transactions t
JOIN hotmart_customers c ON t.customer_id = c.id
JOIN profiles p ON c.user_id = p.id
ORDER BY t.purchase_date DESC
LIMIT 20;

-- =====================================================
-- RECEITA
-- =====================================================

-- 💵 Receita total por status
SELECT
  status,
  COUNT(*) as transactions,
  SUM(amount_total) as total_revenue,
  currency
FROM hotmart_transactions
GROUP BY status, currency
ORDER BY total_revenue DESC;

-- 💵 Receita mensal (últimos 6 meses)
SELECT
  DATE_TRUNC('month', purchase_date) as month,
  COUNT(*) as transactions,
  SUM(amount_total) as revenue,
  currency
FROM hotmart_transactions
WHERE status = 'approved'
  AND purchase_date >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', purchase_date), currency
ORDER BY month DESC;

-- 💵 Receita por tipo de pagamento
SELECT
  payment_type,
  COUNT(*) as transactions,
  SUM(amount_total) as total_revenue,
  AVG(amount_total) as avg_revenue
FROM hotmart_transactions
WHERE status = 'approved'
GROUP BY payment_type
ORDER BY total_revenue DESC;

-- =====================================================
-- ANÁLISE DE CHURN
-- =====================================================

-- 📉 Cancelamentos por mês (últimos 6 meses)
SELECT
  DATE_TRUNC('month', updated_at) as month,
  COUNT(*) as cancellations
FROM hotmart_subscriptions
WHERE status = 'canceled'
  AND updated_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', updated_at)
ORDER BY month DESC;

-- 📉 Usuários que cancelaram e quando
SELECT
  p.email,
  p.full_name,
  s.date_subscription_start,
  s.updated_at as canceled_at,
  s.updated_at - s.date_subscription_start as subscription_duration
FROM profiles p
JOIN hotmart_customers c ON p.id = c.user_id
JOIN hotmart_subscriptions s ON c.id = s.customer_id
WHERE s.status = 'canceled'
ORDER BY s.updated_at DESC
LIMIT 20;

-- =====================================================
-- USUÁRIOS PRO SEM SUBSCRIPTION ATIVA
-- =====================================================

-- ⚠️ Inconsistências: Users Pro sem subscription ativa
SELECT
  p.id,
  p.email,
  p.plan,
  p.subscription_status,
  COUNT(s.id) as active_subscriptions
FROM profiles p
LEFT JOIN hotmart_customers c ON p.id = c.user_id
LEFT JOIN hotmart_subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE p.plan = 'pro'
GROUP BY p.id, p.email, p.plan, p.subscription_status
HAVING COUNT(s.id) = 0;

-- =====================================================
-- PERFORMANCE DO WEBHOOK
-- =====================================================

-- 🕐 Transações recentes (últimas 24h)
SELECT
  created_at,
  transaction,
  status,
  amount_total
FROM hotmart_transactions
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 🕐 Customers criados recentemente (últimas 24h)
SELECT
  created_at,
  email,
  subscriber_code
FROM hotmart_customers
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- =====================================================
-- PRÓXIMAS COBRANÇAS
-- =====================================================

-- 📅 Próximas 20 cobranças
SELECT
  p.email,
  p.full_name,
  s.date_next_charge,
  s.plan_id,
  CASE
    WHEN s.date_next_charge < NOW() THEN '⚠️ Vencida'
    WHEN s.date_next_charge < NOW() + INTERVAL '3 days' THEN '⚠️ Próximos 3 dias'
    WHEN s.date_next_charge < NOW() + INTERVAL '7 days' THEN '📅 Próximos 7 dias'
    ELSE '✅ Futuro'
  END as urgency
FROM hotmart_subscriptions s
JOIN hotmart_customers c ON s.customer_id = c.id
JOIN profiles p ON c.user_id = p.id
WHERE s.status = 'active'
  AND s.date_next_charge IS NOT NULL
ORDER BY s.date_next_charge ASC
LIMIT 20;

-- =====================================================
-- AUDITORIA
-- =====================================================

-- 🔍 Histórico completo de um usuário (substituir email)
SELECT
  'Customer' as type,
  created_at as date,
  'Created customer: ' || subscriber_code as event
FROM hotmart_customers
WHERE email = 'SEU_EMAIL@example.com'
UNION ALL
SELECT
  'Subscription',
  created_at,
  'Subscription created: ' || subscription_id || ' (status: ' || status || ')'
FROM hotmart_subscriptions
WHERE customer_id IN (SELECT id FROM hotmart_customers WHERE email = 'SEU_EMAIL@example.com')
UNION ALL
SELECT
  'Transaction',
  purchase_date,
  'Transaction: ' || transaction || ' (' || status || ') - ' || currency || ' ' || amount_total
FROM hotmart_transactions
WHERE customer_id IN (SELECT id FROM hotmart_customers WHERE email = 'SEU_EMAIL@example.com')
ORDER BY date DESC;

-- 🔍 Listar todos os eventos de um subscriber_code
SELECT
  'Subscription Update' as event_type,
  updated_at as event_date,
  status,
  plan_id
FROM hotmart_subscriptions
WHERE subscriber_code = 'SUB-CODE-AQUI'
ORDER BY updated_at DESC;

-- =====================================================
-- ALERTAS
-- =====================================================

-- 🚨 Assinaturas vencidas (sem renovação nos últimos 7 dias)
SELECT
  p.email,
  s.date_next_charge,
  NOW() - s.date_next_charge as days_overdue
FROM hotmart_subscriptions s
JOIN hotmart_customers c ON s.customer_id = c.id
JOIN profiles p ON c.user_id = p.id
WHERE s.status = 'active'
  AND s.date_next_charge < NOW() - INTERVAL '7 days';

-- 🚨 Usuários Free com subscription ativa (inconsistência)
SELECT
  p.email,
  p.plan,
  s.status,
  s.subscription_id
FROM profiles p
JOIN hotmart_customers c ON p.id = c.user_id
JOIN hotmart_subscriptions s ON c.id = s.customer_id
WHERE p.plan = 'free'
  AND s.status = 'active';

-- =====================================================
-- ESTATÍSTICAS ÚTEIS
-- =====================================================

-- 📊 Taxa de conversão (últimos 30 dias)
SELECT
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.plan = 'pro' THEN p.id END) as pro_users,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN p.plan = 'pro' THEN p.id END) /
    NULLIF(COUNT(DISTINCT p.id), 0),
    2
  ) as conversion_rate_percent
FROM profiles p
WHERE p.created_at >= NOW() - INTERVAL '30 days';

-- 📊 MRR (Monthly Recurring Revenue) - Receita Mensal Recorrente
SELECT
  COUNT(*) as active_subscriptions,
  SUM(
    CASE
      WHEN s.recurrency_period = 30 THEN 24.90  -- Mensal
      WHEN s.recurrency_period = 365 THEN 273.90 / 12  -- Anual (convertido para mensal)
      ELSE 0
    END
  ) as estimated_mrr,
  'BRL' as currency
FROM hotmart_subscriptions s
WHERE s.status = 'active';

-- 📊 Lifetime Value médio por cliente
SELECT
  COUNT(DISTINCT c.id) as total_customers,
  SUM(t.amount_total) as total_revenue,
  AVG(customer_revenue.total) as avg_lifetime_value
FROM hotmart_customers c
LEFT JOIN (
  SELECT
    customer_id,
    SUM(amount_total) as total
  FROM hotmart_transactions
  WHERE status = 'approved'
  GROUP BY customer_id
) customer_revenue ON c.id = customer_revenue.customer_id
LEFT JOIN hotmart_transactions t ON c.id = t.customer_id
WHERE t.status = 'approved' OR t.status IS NULL;
