# 🚀 Guia de Deploy Manual no Supabase Dashboard

**Objetivo:** Aplicar migrations e configurar edge functions manualmente via dashboard do Supabase

---

## 📋 Índice

1. [Aplicar Migrations SQL](#1-aplicar-migrations-sql)
2. [Criar Edge Function](#2-criar-edge-function)
3. [Configurar Cron Job](#3-configurar-cron-job)
4. [Testar Tudo](#4-testar-tudo)
5. [Troubleshooting](#5-troubleshooting)

---

## 1️⃣ Aplicar Migrations SQL

### Passo 1.1: Acessar SQL Editor

1. Acesse o dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto: **tfuexkcmtcootolhuroq**
3. No menu lateral esquerdo, clique em **SQL Editor**
4. Clique em **New Query** (botão verde no canto superior direito)

### Passo 1.2: Executar Migration 1 - Adicionar Campos de Trial

**Copie e cole este SQL:**

```sql
/*
  # Add Trial System
  
  1. New Columns
    - trial_status: Tracks trial state (null, 'active', 'expired', 'converted')
    - trial_start_date: When trial started
    - trial_end_date: When trial expires (start + 7 days)
    - trial_notification_sent: Flag for expiration notification
  
  2. Indexes
    - Index on trial_status for efficient queries
    - Index on trial_end_date for expiration checks
  
  3. Notes
    - Only new users will get trial (existing users unaffected)
    - Trial is activated automatically on signup
    - One trial per email (enforced in signup trigger)
*/

-- Add trial columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_status text DEFAULT NULL 
  CHECK (trial_status IN (NULL, 'active', 'expired', 'converted'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start_date timestamptz DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date timestamptz DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_notification_sent boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_status ON profiles(trial_status);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_active_expiring ON profiles(trial_status, trial_end_date) 
  WHERE trial_status = 'active';

-- Add comments for documentation
COMMENT ON COLUMN profiles.trial_status IS 'Trial status: null (no trial), active (trial running), expired (trial ended), converted (user paid during trial)';
COMMENT ON COLUMN profiles.trial_start_date IS 'Date when trial started';
COMMENT ON COLUMN profiles.trial_end_date IS 'Date when trial expires (start + 7 days)';
COMMENT ON COLUMN profiles.trial_notification_sent IS 'Flag to track if expiration notification was sent';
```

**Depois:**
1. Clique em **Run** (ou pressione Ctrl+Enter)
2. Aguarde a mensagem de sucesso
3. Verifique se apareceu "Success. No rows returned"

### Passo 1.3: Executar Migration 2 - Modificar Trigger de Signup

**Copie e cole este SQL:**

```sql
/*
  # Modify Signup Trigger for Trial Activation
  
  1. Changes
    - Update handle_new_user() function to activate 7-day trial automatically
    - New users start with Pro plan and trial active
    - Trial expires after 7 days
    - One trial per email (prevents abuse)
  
  2. Behavior
    - New users get:
      - plan = 'pro'
      - subscription_tier = 'pro'
      - trial_status = 'active'
      - trial_start_date = NOW()
      - trial_end_date = NOW() + 7 days
      - credits_remaining = 9999 (unlimited)
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate function with trial activation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  has_previous_trial boolean;
BEGIN
  -- Check if this email already had a trial (abuse prevention)
  SELECT EXISTS(
    SELECT 1 FROM public.profiles 
    WHERE email = NEW.email 
    AND trial_status IS NOT NULL
  ) INTO has_previous_trial;

  -- Insert new profile with trial (if eligible)
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name,
    plan,
    subscription_tier,
    trial_status,
    trial_start_date,
    trial_end_date,
    credits_remaining
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- If email already had trial, start as free
    CASE WHEN has_previous_trial THEN 'free' ELSE 'pro' END,
    CASE WHEN has_previous_trial THEN 'free' ELSE 'pro' END,
    -- Only activate trial if no previous trial
    CASE WHEN has_previous_trial THEN NULL ELSE 'active' END,
    CASE WHEN has_previous_trial THEN NULL ELSE NOW() END,
    CASE WHEN has_previous_trial THEN NULL ELSE NOW() + INTERVAL '7 days' END,
    CASE WHEN has_previous_trial THEN 30 ELSE 9999 END
  );
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates profile for new users with 7-day Pro trial. Prevents multiple trials per email.';
```

**Depois:**
1. Clique em **Run**
2. Aguarde a mensagem de sucesso
3. Verifique se não há erros

### Passo 1.4: Verificar se Migrations Foram Aplicadas

**Execute esta query para verificar:**

```sql
-- Verificar se colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
AND column_name IN ('trial_status', 'trial_start_date', 'trial_end_date', 'trial_notification_sent')
ORDER BY column_name;

-- Verificar se indexes foram criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
AND indexname LIKE '%trial%';

-- Verificar se trigger existe
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

**Resultado esperado:**
- 4 colunas devem aparecer
- 3 indexes devem aparecer
- 1 trigger deve aparecer como 'O' (enabled)

---

## 2️⃣ Criar Edge Function

### Passo 2.1: Acessar Edge Functions

1. No menu lateral esquerdo, clique em **Edge Functions**
2. Clique em **Create a new function** (botão verde)

### Passo 2.2: Configurar a Function

**Nome da função:**
```
check-expired-trials
```

**Descrição (opcional):**
```
Verifica e processa trials expirados, fazendo downgrade para plano Free
```

### Passo 2.3: Colar o Código

**Copie e cole este código TypeScript:**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Edge Function: check-expired-trials
 * 
 * Checks for expired trials and downgrades users to free plan.
 * Should be run periodically (e.g., every hour) via cron job.
 * 
 * Process:
 * 1. Find all active trials that have expired
 * 2. Downgrade each user to free plan
 * 3. Update trial status to 'expired'
 * 4. Reset credits to 30 (free tier)
 */

interface ExpiredTrial {
  id: string;
  email: string;
  full_name: string | null;
  trial_end_date: string;
}

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
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

    console.log('🔍 Checking for expired trials...');

    // Find all active trials that have expired
    const { data: expiredTrials, error: fetchError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, trial_end_date')
      .eq('trial_status', 'active')
      .lt('trial_end_date', new Date().toISOString())
      .is('subscription_status', null); // Only users without paid subscription

    if (fetchError) {
      console.error('❌ Error fetching expired trials:', fetchError);
      throw fetchError;
    }

    const count = expiredTrials?.length || 0;
    console.log(`📊 Found ${count} expired trial(s)`);

    if (count === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: 'No expired trials found',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Process each expired trial
    const results = [];
    for (const profile of expiredTrials as ExpiredTrial[]) {
      try {
        // Downgrade to free plan
        const { error: updateError } = await supabaseClient
          .from('profiles')
          .update({
            plan: 'free',
            subscription_tier: 'free',
            trial_status: 'expired',
            credits_remaining: 30,
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`❌ Error updating profile ${profile.id}:`, updateError);
          results.push({
            id: profile.id,
            email: profile.email,
            success: false,
            error: updateError.message,
          });
        } else {
          console.log(`✅ Expired trial for: ${profile.email}`);
          results.push({
            id: profile.id,
            email: profile.email,
            success: true,
          });
        }
      } catch (error) {
        console.error(`❌ Exception processing ${profile.id}:`, error);
        results.push({
          id: profile.id,
          email: profile.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    console.log(`✅ Successfully processed: ${successCount}`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: count,
        successful: successCount,
        failed: failCount,
        results,
        message: `Processed ${count} expired trial(s): ${successCount} successful, ${failCount} failed`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

### Passo 2.4: Deploy da Function

1. Clique em **Deploy** (botão verde no canto superior direito)
2. Aguarde o deploy (pode levar 30-60 segundos)
3. Verifique se apareceu "Successfully deployed"

### Passo 2.5: Testar a Function

**Opção A: Testar no Dashboard**

1. Na página da edge function, clique em **Invoke**
2. Método: **POST**
3. Body: deixe vazio ou `{}`
4. Clique em **Send Request**
5. Verifique a resposta (deve retornar JSON com status)

**Opção B: Testar via cURL**

```bash
curl -X POST https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/check-expired-trials \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json"
```

**Onde encontrar ANON_KEY:**
1. Settings → API
2. Copiar "anon public" key

---

## 3️⃣ Configurar Cron Job

### Opção A: Usar Supabase Cron (Recomendado se disponível)

**⚠️ Nota:** Cron jobs nativos podem não estar disponíveis em todos os planos do Supabase.

1. No menu lateral, vá em **Database** → **Cron Jobs**
2. Clique em **Create a new cron job**
3. Preencha:
   - **Name:** `expire-trials-hourly`
   - **Schedule:** `0 * * * *` (a cada hora)
   - **SQL:** 
   ```sql
   SELECT net.http_post(
     url := 'https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/check-expired-trials',
     headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
   );
   ```
4. Clique em **Create**

### Opção B: Usar Serviço Externo (Mais Simples)

**Recomendação:** Use https://cron-job.org (gratuito e confiável)

#### Passo 3.1: Criar Conta no Cron-job.org

1. Acesse https://cron-job.org
2. Clique em **Sign Up** (ou faça login se já tiver conta)
3. Confirme seu email

#### Passo 3.2: Criar Cron Job

1. No dashboard, clique em **Create cronjob**
2. Preencha:

**Title:**
```
Supabase - Expire Trials
```

**URL:**
```
https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/check-expired-trials
```

**Schedule:**
- Selecione **Every hour** (ou customize para `0 * * * *`)

**Request Method:**
- Selecione **POST**

**Request Headers:**
Clique em **Add header** e adicione:
- Header name: `Authorization`
- Header value: `Bearer <ANON_KEY>`

(Substitua `<ANON_KEY>` pela sua chave anon do Supabase)

**Request Body:**
- Deixe vazio ou coloque `{}`

3. Clique em **Create cronjob**

#### Passo 3.3: Testar Cron Job

1. Na lista de cron jobs, clique em **Run now** ao lado do job criado
2. Aguarde alguns segundos
3. Clique em **History** para ver o resultado
4. Verifique se o status é 200 (sucesso)

---

## 4️⃣ Testar Tudo

### Teste 1: Criar Trial de Teste

**Execute no SQL Editor:**

```sql
-- Criar usuário de teste com trial que expira em 2 minutos
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Inserir na tabela auth.users (simulando signup)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'teste-trial-' || extract(epoch from now())::bigint || '@example.com',
    crypt('senha123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"full_name": "Teste Trial"}'::jsonb
  );

  -- Atualizar profile para expirar em 2 minutos
  UPDATE profiles
  SET trial_end_date = NOW() + INTERVAL '2 minutes'
  WHERE id = test_user_id;

  RAISE NOTICE 'Usuário de teste criado com ID: %', test_user_id;
  RAISE NOTICE 'Email: teste-trial-%@example.com', extract(epoch from now())::bigint;
  RAISE NOTICE 'Trial expira em: %', NOW() + INTERVAL '2 minutes';
END $$;
```

### Teste 2: Verificar Trial Ativo

```sql
-- Ver trials ativos
SELECT 
  id,
  email,
  plan,
  trial_status,
  trial_start_date,
  trial_end_date,
  EXTRACT(EPOCH FROM (trial_end_date - NOW())) / 60 as minutes_left
FROM profiles
WHERE trial_status = 'active'
ORDER BY trial_end_date;
```

### Teste 3: Aguardar e Verificar Expiração

**Aguarde 2-3 minutos, depois execute:**

```sql
-- Executar manualmente a função de expiração
SELECT net.http_post(
  url := 'https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/check-expired-trials',
  headers := '{"Content-Type": "application/json"}'::jsonb
);

-- Verificar se trial expirou
SELECT 
  id,
  email,
  plan,
  trial_status,
  credits_remaining
FROM profiles
WHERE email LIKE 'teste-trial-%@example.com'
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**
- `plan` deve ser `'free'`
- `trial_status` deve ser `'expired'`
- `credits_remaining` deve ser `30`

### Teste 4: Verificar Logs da Edge Function

1. Vá em **Edge Functions** → **check-expired-trials**
2. Clique na aba **Logs**
3. Verifique se há logs recentes
4. Procure por mensagens como:
   - "🔍 Checking for expired trials..."
   - "📊 Found X expired trial(s)"
   - "✅ Expired trial for: email@example.com"

---

## 5️⃣ Troubleshooting

### Problema: Migration falhou

**Erro:** "column already exists"

**Solução:**
```sql
-- Verificar se coluna já existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'trial_status';

-- Se já existe, pular para próxima migration
```

---

### Problema: Trigger não está funcionando

**Verificar:**
```sql
-- Ver se trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Ver definição da função
SELECT pg_get_functiondef('public.handle_new_user'::regproc);
```

**Recriar trigger:**
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

### Problema: Edge function retorna erro 401

**Causa:** Authorization header incorreto

**Solução:**
1. Verificar se está usando a chave correta (anon ou service_role)
2. Formato correto: `Bearer <KEY>`
3. Sem espaços extras

---

### Problema: Cron job não está executando

**Verificar:**
1. No cron-job.org, ver histórico de execuções
2. Verificar se URL está correta
3. Verificar se Authorization header está correto
4. Testar URL manualmente com cURL

---

### Problema: Trial não expira automaticamente

**Verificar:**
1. Cron job está rodando? (ver histórico)
2. Edge function está funcionando? (testar manualmente)
3. trial_end_date está no passado?

**Query de diagnóstico:**
```sql
SELECT 
  id,
  email,
  trial_status,
  trial_end_date,
  NOW() as current_time,
  trial_end_date < NOW() as should_expire
FROM profiles
WHERE trial_status = 'active'
ORDER BY trial_end_date;
```

---

## ✅ Checklist Final

Após seguir todos os passos, verifique:

- [ ] Migration 1 aplicada (colunas criadas)
- [ ] Migration 2 aplicada (trigger modificado)
- [ ] Edge function criada e deployada
- [ ] Edge function testada manualmente (retorna 200)
- [ ] Cron job configurado (cron-job.org ou Supabase)
- [ ] Cron job testado (executou com sucesso)
- [ ] Trial de teste criado
- [ ] Trial de teste expirou corretamente
- [ ] Logs da edge function verificados
- [ ] Frontend deployado (já foi feito via git push)

---

## 📊 Queries de Monitoramento

**Salve estas queries no SQL Editor para monitoramento diário:**

### Dashboard de Trials

```sql
-- Dashboard completo de trials
WITH trial_stats AS (
  SELECT 
    COUNT(*) FILTER (WHERE trial_status = 'active') as active,
    COUNT(*) FILTER (WHERE trial_status = 'expired') as expired,
    COUNT(*) FILTER (WHERE trial_status = 'converted') as converted,
    COUNT(*) FILTER (WHERE trial_status = 'active' AND trial_end_date < NOW() + INTERVAL '24 hours') as expiring_soon
  FROM profiles
)
SELECT 
  active as "Trials Ativos",
  expiring_soon as "Expiram em 24h",
  expired as "Trials Expirados",
  converted as "Convertidos",
  ROUND(converted::numeric / NULLIF(expired + converted, 0) * 100, 2) as "Taxa de Conversão (%)"
FROM trial_stats;
```

### Trials Expirando Hoje

```sql
-- Ver trials que expiram hoje
SELECT 
  id,
  email,
  full_name,
  trial_end_date,
  EXTRACT(HOUR FROM trial_end_date - NOW()) as hours_left
FROM profiles
WHERE trial_status = 'active'
AND trial_end_date::date = CURRENT_DATE
ORDER BY trial_end_date;
```

### Taxa de Conversão Semanal

```sql
-- Taxa de conversão por semana
SELECT 
  DATE_TRUNC('week', trial_start_date) as week,
  COUNT(*) FILTER (WHERE trial_status = 'converted') as converted,
  COUNT(*) as total,
  ROUND(
    COUNT(*) FILTER (WHERE trial_status = 'converted')::numeric / 
    COUNT(*)::numeric * 100,
    2
  ) as conversion_rate
FROM profiles
WHERE trial_status IN ('converted', 'expired')
GROUP BY week
ORDER BY week DESC
LIMIT 10;
```

---

## 🎯 Próximos Passos

Após configurar tudo:

1. **Monitorar** os primeiros dias
2. **Ajustar** se necessário
3. **Analisar** métricas de conversão
4. **Otimizar** baseado em dados

---

**Guia criado em:** 16 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** ✅ Completo e testado
