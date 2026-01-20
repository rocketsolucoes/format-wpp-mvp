-- =====================================================
-- VALIDAÇÃO DOS USUÁRIOS - Diagnóstico
-- =====================================================
-- Execute estas queries para validar os dados dos usuários

-- 1. Ver todos os usuários e seus dados principais
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
  created_at
FROM profiles
ORDER BY created_at DESC;

-- 2. Verificar inconsistências entre plan e subscription_tier
SELECT
  id,
  email,
  plan,
  subscription_tier,
  credits_remaining,
  trial_status,
  CASE
    WHEN plan != subscription_tier THEN '⚠️ INCONSISTENTE'
    ELSE '✅ OK'
  END as status
FROM profiles
WHERE plan != subscription_tier;

-- 3. Verificar usuários com trial expirado que ainda têm créditos Pro (9999)
SELECT
  id,
  email,
  trial_status,
  trial_end_date,
  subscription_tier,
  credits_remaining,
  CASE
    WHEN trial_end_date < NOW() THEN '⚠️ TRIAL EXPIRADO'
    WHEN trial_status = 'expired' THEN '⚠️ TRIAL EXPIRADO'
    ELSE '✅ TRIAL ATIVO'
  END as trial_check
FROM profiles
WHERE trial_status IS NOT NULL;

-- 4. Verificar usuários Free que deveriam ter 10 créditos
SELECT
  id,
  email,
  subscription_tier,
  plan,
  credits_remaining,
  trial_status,
  CASE
    WHEN credits_remaining != 10 THEN '⚠️ DEVERIA TER 10 CRÉDITOS'
    ELSE '✅ OK'
  END as credits_check
FROM profiles
WHERE (subscription_tier = 'free' OR plan = 'free')
  AND trial_status IS NULL
  AND credits_remaining != 10;

-- 5. Verificar usuários sem WhatsApp
SELECT
  id,
  email,
  full_name,
  whatsapp,
  created_at
FROM profiles
WHERE whatsapp IS NULL
ORDER BY created_at DESC;

-- 6. Verificar o usuário específico: agnysmarques@ymail.com
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
  updated_at
FROM profiles
WHERE email = 'agnysmarques@ymail.com';

-- =====================================================
-- QUERIES DE CORREÇÃO (execute DEPOIS de validar)
-- =====================================================

-- 7. Atualizar usuários com trial expirado para Free com 10 créditos
-- IMPORTANTE: Revise antes de executar!
/*
UPDATE profiles
SET
  plan = 'free',
  subscription_tier = 'free',
  credits_remaining = 10
WHERE (trial_status = 'expired' OR trial_end_date < NOW())
  AND subscription_tier = 'pro'
  AND trial_status IS NOT NULL;
*/

-- 8. Sincronizar colunas plan e subscription_tier
-- IMPORTANTE: Revise antes de executar!
/*
UPDATE profiles
SET plan = subscription_tier
WHERE plan != subscription_tier;
*/

-- 9. Corrigir usuários Free que não têm 10 créditos
-- IMPORTANTE: Revise antes de executar!
/*
UPDATE profiles
SET credits_remaining = 10
WHERE (subscription_tier = 'free' OR plan = 'free')
  AND trial_status IS NULL
  AND credits_remaining != 10;
*/
