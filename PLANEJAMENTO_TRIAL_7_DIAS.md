# 🎁 Planejamento: Sistema de Trial Gratuito de 7 Dias

**Data:** 15 de Janeiro de 2026  
**Objetivo:** Implementar trial gratuito de 7 dias do plano Pro para novos usuários

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
3. [Fluxo do Trial](#fluxo-do-trial)
4. [Componentes Frontend](#componentes-frontend)
5. [Lógica Backend](#lógica-backend)
6. [Edge Functions](#edge-functions)
7. [Experiência do Usuário](#experiência-do-usuário)
8. [Implementação Passo a Passo](#implementação-passo-a-passo)
9. [Considerações Importantes](#considerações-importantes)

---

## 🎯 Visão Geral

### Objetivo
Oferecer 7 dias de acesso gratuito ao plano Pro para novos usuários, com o objetivo de:
- Aumentar conversão de free para pro
- Permitir que usuários experimentem recursos premium
- Criar senso de urgência para conversão

### Comportamento Esperado

1. **Novo usuário se cadastra** → Ativa trial automaticamente
2. **Durante o trial** → Acesso completo ao plano Pro
3. **Avisos progressivos** → Notificações sobre dias restantes
4. **Final do trial** → Modal de renovação + downgrade para Free

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `profiles`

**Campos Existentes:**
```sql
- id (uuid)
- email (text)
- full_name (text)
- plan (text) -- 'free', 'pro', 'enterprise'
- subscription_tier (text)
- subscription_status (text)
- credits_remaining (integer)
- created_at (timestamptz)
- updated_at (timestamptz)
```

**Campos a Adicionar:**
```sql
ALTER TABLE profiles ADD COLUMN trial_status text DEFAULT NULL;
-- Valores: null, 'active', 'expired', 'converted'

ALTER TABLE profiles ADD COLUMN trial_start_date timestamptz DEFAULT NULL;
-- Data de início do trial

ALTER TABLE profiles ADD COLUMN trial_end_date timestamptz DEFAULT NULL;
-- Data de término do trial (start_date + 7 dias)

ALTER TABLE profiles ADD COLUMN trial_notification_sent boolean DEFAULT false;
-- Flag para controlar se já enviou notificação de expiração
```

### Migration SQL

```sql
-- Migration: 20260115_add_trial_system.sql

/*
  # Add Trial System
  
  1. New Columns
    - trial_status: Tracks trial state (null, active, expired, converted)
    - trial_start_date: When trial started
    - trial_end_date: When trial expires
    - trial_notification_sent: Flag for expiration notification
  
  2. Indexes
    - Index on trial_status for efficient queries
    - Index on trial_end_date for expiration checks
*/

-- Add trial columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_status text DEFAULT NULL 
  CHECK (trial_status IN (NULL, 'active', 'expired', 'converted'));

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_start_date timestamptz DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_end_date timestamptz DEFAULT NULL;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_notification_sent boolean DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_trial_status ON profiles(trial_status);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end_date ON profiles(trial_end_date);

-- Comment for documentation
COMMENT ON COLUMN profiles.trial_status IS 'Trial status: null (no trial), active, expired, converted';
COMMENT ON COLUMN profiles.trial_start_date IS 'Date when trial started';
COMMENT ON COLUMN profiles.trial_end_date IS 'Date when trial expires (start + 7 days)';
```

---

## 🔄 Fluxo do Trial

### 1. Ativação Automática (Signup)

**Quando:** Usuário cria conta pela primeira vez

**Ação:**
```typescript
// Trigger no signup
INSERT INTO profiles (
  id,
  email,
  plan,
  subscription_tier,
  trial_status,
  trial_start_date,
  trial_end_date,
  credits_remaining
) VALUES (
  user_id,
  user_email,
  'pro',                                    -- Começa como Pro
  'pro',
  'active',                                 -- Trial ativo
  NOW(),                                    -- Agora
  NOW() + INTERVAL '7 days',                -- +7 dias
  9999                                      -- Créditos ilimitados
);
```

**Modificação Necessária:**
- Atualizar função `handle_new_user()` no trigger de signup
- Localização: Migration `20251105012511_fix_rls_performance_and_security_v3.sql`

---

### 2. Durante o Trial

**Status do Usuário:**
- `plan = 'pro'`
- `trial_status = 'active'`
- `credits_remaining = 9999` (ilimitado)
- Acesso total aos recursos Pro

**Avisos Progressivos:**

| Dia | Ação | Mensagem |
|-----|------|----------|
| **Dia 1-4** | Nenhuma | Usuário usa livremente |
| **Dia 5** | Toast/Banner | "🎉 Restam 3 dias do seu trial Pro!" |
| **Dia 6** | Toast/Banner | "⏰ Restam 2 dias do seu trial Pro!" |
| **Dia 7** | Toast/Banner | "⚠️ Último dia do seu trial Pro!" |
| **Dia 8** | Modal | "Trial expirado - Assine agora!" |

---

### 3. Verificação de Expiração

**Método 1: Edge Function Agendada (Recomendado)**

```typescript
// supabase/functions/check-expired-trials/index.ts

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Buscar trials expirados
  const { data: expiredTrials } = await supabaseClient
    .from('profiles')
    .select('id, email, trial_end_date')
    .eq('trial_status', 'active')
    .lt('trial_end_date', new Date().toISOString());

  // Para cada trial expirado
  for (const profile of expiredTrials || []) {
    await supabaseClient
      .from('profiles')
      .update({
        plan: 'free',
        subscription_tier: 'free',
        trial_status: 'expired',
        credits_remaining: 30,
      })
      .eq('id', profile.id);

    console.log(`Trial expired for user: ${profile.email}`);
  }

  return new Response(
    JSON.stringify({ processed: expiredTrials?.length || 0 }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Agendamento:** Cron job no Supabase (rodar a cada hora)

---

**Método 2: Verificação no Frontend**

```typescript
// hooks/useTrialStatus.ts

export function useTrialStatus() {
  const { user, profile } = useAuth();
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);

  useEffect(() => {
    if (!profile) return;

    const checkTrial = () => {
      if (profile.trial_status === 'active' && profile.trial_end_date) {
        const endDate = new Date(profile.trial_end_date);
        const now = new Date();
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
          // Trial expirado - fazer downgrade
          handleTrialExpired();
        } else {
          setTrialInfo({
            daysLeft,
            endDate,
            isActive: true,
          });
        }
      }
    };

    checkTrial();
    const interval = setInterval(checkTrial, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [profile]);

  return trialInfo;
}
```

---

### 4. Conversão (Usuário Assina)

**Quando:** Usuário completa pagamento na Hotmart durante o trial

**Ação no Webhook:**
```typescript
// Atualizar profile
await supabaseClient
  .from('profiles')
  .update({
    plan: 'pro',
    subscription_tier: 'pro',
    subscription_status: 'active',
    trial_status: 'converted',  // Marca como convertido
    credits_remaining: 9999,
  })
  .eq('id', userId);
```

**Benefício:** Saber quantos usuários converteram durante o trial

---

## 🎨 Componentes Frontend

### 1. Banner de Trial no Dashboard

**Localização:** `src/components/TrialBanner.tsx`

```tsx
import React from 'react';
import { Clock, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { useLocation } from 'wouter';
import { useTrialStatus } from '../hooks/useTrialStatus';

export function TrialBanner() {
  const [, setLocation] = useLocation();
  const trialInfo = useTrialStatus();

  if (!trialInfo?.isActive) return null;

  const { daysLeft } = trialInfo;

  // Cores baseadas em dias restantes
  const getColors = () => {
    if (daysLeft <= 1) return 'bg-red-500/10 border-red-500/30 text-red-400';
    if (daysLeft <= 3) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  };

  return (
    <div className={`rounded-xl border p-4 ${getColors()} mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="font-semibold">
              {daysLeft === 1 
                ? '⚠️ Último dia do seu trial Pro!' 
                : `🎉 Restam ${daysLeft} dias do seu trial Pro!`}
            </p>
            <p className="text-sm opacity-80">
              Aproveite todos os recursos premium gratuitamente
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation('/pricing')}
          variant="outline"
          size="sm"
        >
          Assinar Agora
        </Button>
      </div>
    </div>
  );
}
```

**Onde usar:**
- Dashboard principal
- Página de formatação
- Histórico

---

### 2. Modal de Trial Expirado

**Localização:** `src/components/TrialExpiredModal.tsx`

```tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';

export function TrialExpiredModal() {
  const [, setLocation] = useLocation();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Mostrar modal se trial expirou
    if (profile?.trial_status === 'expired') {
      setIsOpen(true);
    }
  }, [profile]);

  const handleUpgrade = () => {
    setIsOpen(false);
    setLocation('/pricing');
  };

  const handleContinueFree = () => {
    setIsOpen(false);
    // Opcional: Atualizar flag no banco para não mostrar novamente
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Seu trial de 7 dias expirou
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Esperamos que tenha aproveitado todos os recursos premium! 🎉
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm">O que você ganhou com o Pro:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Créditos ilimitados</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Histórico completo</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Análises avançadas</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              Continuar com Pro - R$ 24,90/mês
            </Button>
            <Button
              onClick={handleContinueFree}
              variant="ghost"
              className="w-full"
            >
              Continuar com plano Free
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Onde usar:**
- App.tsx (global)
- Verificar automaticamente ao carregar

---

### 3. Badge de Trial

**Localização:** `src/components/TrialBadge.tsx`

```tsx
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function TrialBadge() {
  const { profile } = useAuth();

  if (profile?.trial_status !== 'active') return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-full text-xs font-semibold text-emerald-400">
      <Sparkles className="w-3 h-3" />
      Trial Pro
    </div>
  );
}
```

**Onde usar:**
- Sidebar (ao lado do nome do plano)
- Header
- Página de configurações

---

## ⚙️ Lógica Backend

### 1. Modificar Trigger de Signup

**Arquivo:** Migration `20251105012511_fix_rls_performance_and_security_v3.sql`

**Função:** `handle_new_user()`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
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
    'pro',                                    -- Começa como Pro
    'pro',                                    -- Tier Pro
    'active',                                 -- Trial ativo
    NOW(),                                    -- Início agora
    NOW() + INTERVAL '7 days',                -- Fim em 7 dias
    9999                                      -- Créditos ilimitados
  );
  RETURN NEW;
END;
$$;
```

---

### 2. Função para Verificar Expiração

```sql
-- Function: check_and_expire_trials()

CREATE OR REPLACE FUNCTION check_and_expire_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualizar trials expirados
  UPDATE profiles
  SET 
    plan = 'free',
    subscription_tier = 'free',
    trial_status = 'expired',
    credits_remaining = 30
  WHERE 
    trial_status = 'active'
    AND trial_end_date < NOW()
    AND subscription_status IS NULL;  -- Não tem assinatura paga
    
  -- Log para debug
  RAISE NOTICE 'Expired trials processed';
END;
$$;
```

**Executar via Cron:**
- Supabase Dashboard → Database → Cron Jobs
- Schedule: `0 * * * *` (a cada hora)
- SQL: `SELECT check_and_expire_trials();`

---

## 🔧 Edge Functions

### Edge Function: check-expired-trials

**Arquivo:** `supabase/functions/check-expired-trials/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar trials expirados
    const { data: expiredTrials, error } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, trial_end_date')
      .eq('trial_status', 'active')
      .lt('trial_end_date', new Date().toISOString())
      .is('subscription_status', null);

    if (error) throw error;

    console.log(`Found ${expiredTrials?.length || 0} expired trials`);

    // Processar cada trial expirado
    for (const profile of expiredTrials || []) {
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
        console.error(`Error updating profile ${profile.id}:`, updateError);
      } else {
        console.log(`✅ Expired trial for: ${profile.email}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: expiredTrials?.length || 0,
        message: `Processed ${expiredTrials?.length || 0} expired trials`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
```

**Deploy:**
```bash
supabase functions deploy check-expired-trials
```

**Agendar via Cron:**
- Usar serviço externo como Cron-job.org
- URL: `https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/check-expired-trials`
- Frequência: A cada hora
- Header: `Authorization: Bearer <anon_key>`

---

## 👤 Experiência do Usuário

### Jornada Completa

#### Dia 0: Signup
```
1. Usuário cria conta
2. ✅ Trial ativado automaticamente
3. Redirecionado para dashboard
4. Banner: "🎉 Você ganhou 7 dias de trial Pro grátis!"
5. Badge "Trial Pro" visível na sidebar
```

#### Dias 1-4: Uso Normal
```
- Usuário usa recursos Pro livremente
- Créditos ilimitados
- Histórico completo
- Análises avançadas
- Sem avisos (deixa usar tranquilo)
```

#### Dia 5: Primeiro Aviso
```
- Banner amarelo: "🎉 Restam 3 dias do seu trial Pro!"
- Botão "Assinar Agora" no banner
- Badge continua visível
```

#### Dia 6: Segundo Aviso
```
- Banner laranja: "⏰ Restam 2 dias do seu trial Pro!"
- Notificação toast ao fazer login
- CTA mais visível
```

#### Dia 7: Último Dia
```
- Banner vermelho: "⚠️ Último dia do seu trial Pro!"
- Notificação persistente
- Modal suave sugerindo assinatura
```

#### Dia 8: Expiração
```
1. Trial expira automaticamente
2. Modal de expiração aparece
3. Opções:
   - "Continuar com Pro - R$ 24,90/mês" (destaque)
   - "Continuar com plano Free" (secundário)
4. Downgrade para Free se não assinar
5. Créditos reduzidos para 30
```

---

## 🛠️ Implementação Passo a Passo

### Fase 1: Banco de Dados (1-2 horas)

**Tarefas:**
1. ✅ Criar migration com novos campos
2. ✅ Adicionar indexes
3. ✅ Modificar função `handle_new_user()`
4. ✅ Criar função `check_and_expire_trials()`
5. ✅ Testar migration em ambiente de dev

**Arquivos:**
- `supabase/migrations/20260115_add_trial_system.sql`
- `supabase/migrations/20260115_modify_signup_trigger.sql`

---

### Fase 2: Hooks e Lógica (2-3 horas)

**Tarefas:**
1. ✅ Criar hook `useTrialStatus()`
2. ✅ Adicionar lógica de verificação
3. ✅ Calcular dias restantes
4. ✅ Detectar expiração

**Arquivos:**
- `src/hooks/useTrialStatus.ts`
- `src/types/trial.ts`

---

### Fase 3: Componentes UI (3-4 horas)

**Tarefas:**
1. ✅ Criar `TrialBanner.tsx`
2. ✅ Criar `TrialExpiredModal.tsx`
3. ✅ Criar `TrialBadge.tsx`
4. ✅ Integrar no Dashboard
5. ✅ Integrar no App.tsx

**Arquivos:**
- `src/components/TrialBanner.tsx`
- `src/components/TrialExpiredModal.tsx`
- `src/components/TrialBadge.tsx`
- `src/pages/Dashboard.tsx` (modificar)
- `src/App.tsx` (modificar)

---

### Fase 4: Edge Function (1-2 horas)

**Tarefas:**
1. ✅ Criar edge function
2. ✅ Testar localmente
3. ✅ Deploy para produção
4. ✅ Configurar cron job

**Arquivos:**
- `supabase/functions/check-expired-trials/index.ts`

---

### Fase 5: Testes (2-3 horas)

**Tarefas:**
1. ✅ Criar conta de teste
2. ✅ Verificar ativação do trial
3. ✅ Testar avisos progressivos
4. ✅ Testar modal de expiração
5. ✅ Testar downgrade
6. ✅ Testar conversão (pagamento)

---

### Fase 6: Ajustes e Deploy (1 hora)

**Tarefas:**
1. ✅ Revisar código
2. ✅ Documentar
3. ✅ Commit e push
4. ✅ Deploy em produção
5. ✅ Monitorar logs

---

## ⚠️ Considerações Importantes

### 1. Prevenção de Abuso

**Problema:** Usuário pode criar múltiplas contas para ter trials infinitos

**Soluções:**

#### Opção A: Limitar por Email
```sql
-- Verificar se email já teve trial
CREATE OR REPLACE FUNCTION check_trial_eligibility(user_email text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  has_trial boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE email = user_email 
    AND trial_status IS NOT NULL
  ) INTO has_trial;
  
  RETURN NOT has_trial;
END;
$$;
```

#### Opção B: Limitar por IP (mais complexo)
- Registrar IP no signup
- Verificar se IP já teve trial
- Requer tabela adicional

#### Opção C: Verificação por CPF (mais seguro)
- Solicitar CPF no signup
- Validar CPF
- Um trial por CPF

**Recomendação:** Começar com Opção A (email) e monitorar

---

### 2. Usuários Existentes

**Problema:** O que fazer com usuários que já existem?

**Opções:**

#### Opção A: Não dar trial
- Apenas novos usuários ganham trial
- Mais justo
- Evita "gaming" do sistema

#### Opção B: Dar trial para todos
- Usuários free existentes ganham trial
- Boa vontade
- Pode aumentar conversão

**Recomendação:** Opção A (apenas novos)

**Implementação:**
```sql
-- Script one-time para dar trial a usuários existentes (se escolher Opção B)
UPDATE profiles
SET 
  plan = 'pro',
  subscription_tier = 'pro',
  trial_status = 'active',
  trial_start_date = NOW(),
  trial_end_date = NOW() + INTERVAL '7 days',
  credits_remaining = 9999
WHERE 
  plan = 'free'
  AND subscription_status IS NULL
  AND trial_status IS NULL;
```

---

### 3. Métricas e Analytics

**Dados a Coletar:**

```sql
-- Query: Taxa de conversão do trial
SELECT 
  COUNT(*) FILTER (WHERE trial_status = 'converted') as converted,
  COUNT(*) FILTER (WHERE trial_status = 'expired') as expired,
  COUNT(*) FILTER (WHERE trial_status = 'active') as active,
  ROUND(
    COUNT(*) FILTER (WHERE trial_status = 'converted')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE trial_status IN ('converted', 'expired')), 0) * 100,
    2
  ) as conversion_rate
FROM profiles
WHERE trial_status IS NOT NULL;
```

**Dashboard de Métricas:**
- Total de trials ativos
- Total de trials expirados
- Total de conversões
- Taxa de conversão (%)
- Receita gerada por trials convertidos

---

### 4. Comunicação por Email

**Emails a Enviar:**

1. **Boas-vindas + Trial ativado**
   - Assunto: "🎉 Bem-vindo! Você ganhou 7 dias de Pro grátis"
   - Conteúdo: Explicar recursos Pro

2. **3 dias restantes**
   - Assunto: "⏰ Restam 3 dias do seu trial Pro"
   - Conteúdo: Lembrar benefícios

3. **1 dia restante**
   - Assunto: "⚠️ Último dia do seu trial Pro!"
   - Conteúdo: CTA forte para assinar

4. **Trial expirado**
   - Assunto: "Seu trial expirou - Continue com Pro!"
   - Conteúdo: Oferta especial (desconto?)

**Implementação:**
- Usar serviço de email (SendGrid, Resend, etc)
- Trigger via edge function
- Armazenar flag de "email enviado" no banco

---

### 5. A/B Testing

**Variações para Testar:**

| Variação | Duração | Descrição |
|----------|---------|-----------|
| **A** | 7 dias | Padrão |
| **B** | 14 dias | Trial mais longo |
| **C** | 3 dias | Trial mais curto |

**Hipóteses:**
- Trial mais longo = mais conversão?
- Trial mais curto = senso de urgência?

**Implementação:**
```sql
-- Adicionar campo para A/B test
ALTER TABLE profiles ADD COLUMN trial_variant text DEFAULT 'A';

-- Randomizar no signup
trial_variant = CASE 
  WHEN random() < 0.33 THEN 'A'
  WHEN random() < 0.66 THEN 'B'
  ELSE 'C'
END
```

---

## 📊 Queries Úteis

### Monitoramento

```sql
-- Trials ativos agora
SELECT COUNT(*) FROM profiles WHERE trial_status = 'active';

-- Trials que expiram hoje
SELECT id, email, trial_end_date 
FROM profiles 
WHERE trial_status = 'active' 
AND trial_end_date::date = CURRENT_DATE;

-- Trials que expiram nos próximos 3 dias
SELECT id, email, trial_end_date,
  EXTRACT(DAY FROM trial_end_date - NOW()) as days_left
FROM profiles 
WHERE trial_status = 'active' 
AND trial_end_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
ORDER BY trial_end_date;

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
ORDER BY week DESC;
```

---

## ✅ Checklist de Implementação

### Banco de Dados
- [ ] Criar migration com campos de trial
- [ ] Adicionar indexes
- [ ] Modificar trigger de signup
- [ ] Criar função de expiração
- [ ] Testar em ambiente de dev
- [ ] Aplicar em produção

### Backend
- [ ] Criar edge function de verificação
- [ ] Deploy da edge function
- [ ] Configurar cron job
- [ ] Testar manualmente

### Frontend
- [ ] Criar hook useTrialStatus
- [ ] Criar TrialBanner
- [ ] Criar TrialExpiredModal
- [ ] Criar TrialBadge
- [ ] Integrar no Dashboard
- [ ] Integrar no App.tsx
- [ ] Testar UI em modo claro/escuro

### Testes
- [ ] Criar conta de teste
- [ ] Verificar ativação automática
- [ ] Testar avisos progressivos
- [ ] Testar modal de expiração
- [ ] Testar downgrade
- [ ] Testar conversão via Hotmart
- [ ] Verificar logs

### Documentação
- [ ] Documentar fluxo completo
- [ ] Criar guia de troubleshooting
- [ ] Atualizar README
- [ ] Documentar queries úteis

### Deploy
- [ ] Commit e push
- [ ] Deploy automático
- [ ] Verificar em produção
- [ ] Monitorar métricas
- [ ] Ajustar conforme necessário

---

## 🎯 Próximos Passos

1. **Revisar este planejamento** com o time
2. **Decidir sobre**:
   - Duração do trial (7, 14 ou 3 dias?)
   - Dar trial para usuários existentes?
   - Implementar prevenção de abuso?
   - Enviar emails automáticos?
3. **Estimar tempo** de implementação
4. **Priorizar** features (MVP vs completo)
5. **Começar implementação** fase por fase

---

## 📚 Recursos Adicionais

### Inspiração de Outros Produtos

- **Notion:** 7 dias de trial, avisos no app
- **Spotify:** 30 dias grátis, email no final
- **Netflix:** 30 dias, cancela automaticamente
- **Canva:** 30 dias Pro, downgrade suave

### Melhores Práticas

1. **Não pedir cartão de crédito** no trial
2. **Avisar com antecedência** sobre expiração
3. **Facilitar conversão** (1 clique)
4. **Downgrade suave** (não perder dados)
5. **Oferecer desconto** no final do trial (opcional)

---

**Documento criado em:** 15 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** Planejamento completo ✅
