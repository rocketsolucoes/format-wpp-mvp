-- =====================================================
-- VALIDAÇÃO RÁPIDA - Execute no SQL Editor
-- =====================================================
-- https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/sql/new

-- 1. ✅ Verificar tabelas Hotmart criadas (espera: 3 tabelas)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'hotmart%'
ORDER BY tablename;

-- 2. ✅ Verificar tabelas Stripe removidas (espera: 0 linhas)
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'stripe%'
ORDER BY tablename;

-- 3. ✅ Verificar policies RLS (espera: 3 policies)
SELECT tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'hotmart%'
ORDER BY tablename;

-- 4. ✅ Verificar view criada (espera: 1 linha)
SELECT viewname
FROM pg_views
WHERE viewname = 'hotmart_user_active_subscription';

-- 5. ✅ Verificar índices (espera: ~9 índices)
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename LIKE 'hotmart%'
ORDER BY tablename, indexname;

-- 6. ✅ Verificar triggers (espera: 2 triggers)
SELECT event_object_table, trigger_name
FROM information_schema.triggers
WHERE event_object_table LIKE 'hotmart%';

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Query 1: hotmart_customers, hotmart_subscriptions, hotmart_transactions
-- Query 2: (vazio)
-- Query 3: 3 policies
-- Query 4: hotmart_user_active_subscription
-- Query 5: ~9 índices
-- Query 6: 2 triggers (customers_updated_at, subscriptions_updated_at)
