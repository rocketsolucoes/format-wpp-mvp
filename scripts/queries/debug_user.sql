-- =====================================================
-- DEBUG: Investigar usuário agnysmarques@ymail.com
-- =====================================================

-- 1. Ver TODOS os dados do usuário
SELECT
  id,
  email,
  full_name,
  whatsapp,
  plan,
  subscription_tier,
  credits_remaining,
  trial_status,
  trial_start_date,
  trial_end_date,
  created_at,
  updated_at,
  -- Calcular se trial está expirado
  CASE
    WHEN trial_end_date IS NULL THEN 'SEM TRIAL'
    WHEN trial_end_date < NOW() THEN '⚠️ EXPIRADO (end_date no passado)'
    WHEN trial_end_date >= NOW() THEN '✅ ATIVO (end_date no futuro)'
  END as trial_date_status,
  -- Diferença em dias
  CASE
    WHEN trial_end_date IS NOT NULL THEN
      EXTRACT(DAY FROM (trial_end_date - NOW()))
  END as days_until_expiry
FROM profiles
WHERE email = 'agnysmarques@ymail.com';

-- 2. Ver se a migration #2 deveria ter pego esse usuário
-- (Debug: Simular as condições da migration)

-- 2a. Deveria ter expirado o trial?
SELECT
  'Deveria EXPIRAR trial?' as check_name,
  CASE
    WHEN trial_status = 'active' AND trial_end_date < NOW() THEN '✅ SIM - trial_status=active e trial_end_date < NOW()'
    WHEN trial_status = 'active' AND trial_end_date >= NOW() THEN '❌ NÃO - trial ainda está ativo (end_date no futuro)'
    WHEN trial_status IS NULL THEN '❌ NÃO - sem trial'
    WHEN trial_status = 'expired' THEN '⚠️ JÁ EXPIRADO'
    ELSE '❓ OUTRO: ' || COALESCE(trial_status, 'NULL')
  END as result,
  trial_status,
  trial_end_date,
  NOW() as now
FROM profiles
WHERE email = 'agnysmarques@ymail.com';

-- 2b. Deveria ter feito downgrade?
SELECT
  'Deveria fazer DOWNGRADE?' as check_name,
  CASE
    WHEN trial_status = 'expired' AND (subscription_tier = 'pro' OR plan = 'pro') THEN '✅ SIM - trial expired e ainda é pro'
    WHEN trial_status != 'expired' THEN '❌ NÃO - trial não está expired'
    WHEN subscription_tier = 'free' AND plan = 'free' THEN '✅ JÁ É FREE'
    ELSE '❓ OUTRO'
  END as result,
  trial_status,
  subscription_tier,
  plan,
  credits_remaining
FROM profiles
WHERE email = 'agnysmarques@ymail.com';

-- 2c. Deveria ter ajustado créditos?
SELECT
  'Deveria ajustar CRÉDITOS?' as check_name,
  CASE
    WHEN (subscription_tier = 'free' OR plan = 'free') AND trial_status IS NULL AND credits_remaining != 10
      THEN '✅ SIM - é free sem trial e tem ' || credits_remaining || ' créditos'
    WHEN (subscription_tier = 'free' OR plan = 'free') AND trial_status IS NULL AND credits_remaining = 10
      THEN '✅ JÁ CORRETO - 10 créditos'
    WHEN trial_status IS NOT NULL
      THEN '❌ NÃO - ainda tem trial (' || trial_status || ')'
    ELSE '❓ OUTRO'
  END as result,
  subscription_tier,
  plan,
  trial_status,
  credits_remaining
FROM profiles
WHERE email = 'agnysmarques@ymail.com';

-- =====================================================
-- 3. CORREÇÃO MANUAL (se as migrations não funcionaram)
-- =====================================================

-- 3a. Se o trial estiver ATIVO mas deveria estar EXPIRADO:
/*
UPDATE profiles
SET
  trial_status = 'expired',
  plan = 'free',
  subscription_tier = 'free',
  credits_remaining = 10,
  updated_at = NOW()
WHERE email = 'agnysmarques@ymail.com'
  AND trial_end_date < NOW();
*/

-- 3b. Se o trial já estiver EXPIRADO mas ainda for PRO:
/*
UPDATE profiles
SET
  plan = 'free',
  subscription_tier = 'free',
  credits_remaining = 10,
  updated_at = NOW()
WHERE email = 'agnysmarques@ymail.com'
  AND trial_status = 'expired';
*/

-- 3c. Se for FREE mas tiver créditos errados:
/*
UPDATE profiles
SET
  credits_remaining = 10,
  updated_at = NOW()
WHERE email = 'agnysmarques@ymail.com'
  AND subscription_tier = 'free'
  AND credits_remaining != 10;
*/

-- =====================================================
-- 4. Verificar se a migration foi executada
-- =====================================================

SELECT
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
WHERE version IN ('20260120000001', '20260120000002', '20260120000003')
ORDER BY version;

-- Se não aparecer, a migration não foi executada!
