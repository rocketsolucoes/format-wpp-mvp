-- =====================================================
-- VALIDAÇÃO DAS MIGRATIONS - Hotmart
-- =====================================================
-- Execute estas queries para validar que tudo está correto

-- 1. Verificar que as 3 tabelas Hotmart foram criadas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'hotmart%'
ORDER BY tablename;
-- Esperado: hotmart_customers, hotmart_subscriptions, hotmart_transactions

-- 2. Verificar estrutura da tabela hotmart_customers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'hotmart_customers'
ORDER BY ordinal_position;
-- Esperado: 6 colunas (id, user_id, subscriber_code, email, created_at, updated_at)

-- 3. Verificar estrutura da tabela hotmart_subscriptions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hotmart_subscriptions'
ORDER BY ordinal_position;
-- Esperado: 10 colunas

-- 4. Verificar estrutura da tabela hotmart_transactions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hotmart_transactions'
ORDER BY ordinal_position;
-- Esperado: 11 colunas

-- 5. Verificar RLS policies criadas
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE 'hotmart%'
ORDER BY tablename, policyname;
-- Esperado: 3 policies (uma para cada tabela)

-- 6. Verificar índices criados
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'hotmart%'
ORDER BY tablename, indexname;
-- Esperado: 9 índices (3 por tabela aproximadamente)

-- 7. Verificar view hotmart_user_active_subscription
SELECT viewname
FROM pg_views
WHERE viewname = 'hotmart_user_active_subscription';
-- Esperado: 1 linha

-- 8. Verificar triggers de updated_at
SELECT
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE event_object_table LIKE 'hotmart%'
ORDER BY event_object_table;
-- Esperado: 2 triggers (customers e subscriptions)

-- 9. Verificar que tabelas Stripe foram removidas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE 'stripe%'
ORDER BY tablename;
-- Esperado: 0 linhas (nenhuma tabela stripe)

-- 10. Verificar foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name LIKE 'hotmart%'
ORDER BY tc.table_name, kcu.column_name;
-- Esperado: 4 foreign keys (customer_id em subscriptions/transactions, user_id em customers)

-- =====================================================
-- QUERIES DE TESTE (opcional)
-- =====================================================

-- Testar que não há dados ainda (tabelas vazias)
SELECT 'hotmart_customers' as table_name, COUNT(*) as row_count FROM hotmart_customers
UNION ALL
SELECT 'hotmart_subscriptions', COUNT(*) FROM hotmart_subscriptions
UNION ALL
SELECT 'hotmart_transactions', COUNT(*) FROM hotmart_transactions;
-- Esperado: 0 linhas em todas

-- Testar view (deve retornar vazio também)
SELECT * FROM hotmart_user_active_subscription;
-- Esperado: 0 linhas
