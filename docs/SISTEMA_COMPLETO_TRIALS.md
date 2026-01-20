# 🎯 Sistema Completo de Trials - Como Funciona Agora

## ✅ Resposta Rápida: É AUTOMÁTICO!

**Sim! Agora a expiração de trials é 100% automática.** Você nunca mais precisa executar migrations manualmente! 🎉

---

## 🔄 Ciclo de Vida Completo do Trial

### 1️⃣ **Usuário Cria Conta** (Dia 0)

**O que acontece**:
```
Frontend → signUp() → Supabase Auth cria usuário →
Trigger handle_new_user() executa automaticamente →
Cria perfil com:
- trial_status: 'active'
- trial_start_date: NOW()
- trial_end_date: NOW() + 7 dias
- subscription_tier: 'pro'
- credits_remaining: 9999
```

**Resultado**: Usuário começa com 7 dias de trial Pro (créditos ilimitados)

✅ **Automático** (Trigger do banco)

---

### 2️⃣ **Durante o Trial** (Dias 1-7)

**O que acontece**:
- Usuário tem acesso completo ao plano Pro
- Créditos ilimitados (9999)
- Todos os recursos liberados
- Histórico completo
- Estilos premium

✅ **Nenhuma ação necessária**

---

### 3️⃣ **Trial Expira** (Dia 7+)

**O que acontece**:

#### **Opção A: Cron Job (Principal)** ⏰
```
00:00 UTC → Cron executa expire_trial_subscriptions() →
Detecta trial_end_date < NOW() →
Atualiza automaticamente:
- trial_status: 'active' → 'expired'
- subscription_tier: 'pro' → 'free'
- plan: 'pro' → 'free'
- credits_remaining: 9999 → 10
```

✅ **Totalmente automático** (Executa todo dia à meia-noite)

#### **Opção B: Login do Usuário (Backup)** 🔄
```
Usuário faz login →
AuthContext.fetchUserProfile() →
checkAndExpireTrial() verifica se trial expirou →
Se sim, atualiza imediatamente →
Busca perfil atualizado
```

✅ **Automático no login** (Redundância caso cron falhe)

**Resultado**: Usuário é downgraded para Free com 10 créditos

---

### 4️⃣ **Após Expiração** (Permanente)

**O que o usuário tem**:
- Plano: Free
- Créditos: 10 por mês
- Acesso limitado
- Histórico bloqueado (banner de upgrade)
- Apenas estilos básicos

✅ **Permanente até fazer upgrade manual**

---

## 🛡️ Redundância Tripla

O sistema tem **3 camadas de segurança** para garantir expiração:

### **Camada 1: Cron Diário** (Principal)
- ⏰ Executa todo dia às 00:00 UTC
- 🔍 Varre TODOS os usuários
- 🔄 Expira trials automaticamente
- 📊 Registra logs em `trial_expiration_logs`

### **Camada 2: Verificação no Login** (Backup)
- 🔐 Executa quando usuário faz login
- ⚡ Verifica trial daquele usuário específico
- 🔄 Expira imediatamente se necessário
- 🚀 Garante dados corretos mesmo se cron falhar

### **Camada 3: Execução Manual** (Emergência)
- 🛠️ Você pode executar manualmente se precisar
- ```sql
  SELECT * FROM expire_trial_subscriptions();
  ```
- 🎯 Útil para testes ou correções emergenciais

---

## 📊 Fluxograma Visual

```
┌─────────────────────────────────────────────────────────────┐
│ NOVO USUÁRIO                                                │
│ (Trigger automático cria perfil com trial de 7 dias)       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
          ┌────────────────────────┐
          │  TRIAL ATIVO (7 dias)  │
          │  - Pro: 9999 créditos  │
          │  - Todos recursos      │
          └────────────┬───────────┘
                       ↓
          ┌────────────────────────┐
          │  DIA 7: Trial Expira   │
          └─────┬────────────┬─────┘
                │            │
       ┌────────┴────┐  ┌───┴────────┐
       │ CRON DIÁRIO │  │ LOGIN USER │ ← Redundância
       │  00:00 UTC  │  │  Verifica  │
       └────────┬────┘  └───┬────────┘
                │            │
                └────────┬───┘
                         ↓
          ┌─────────────────────────────┐
          │  AUTO-DOWNGRADE PARA FREE   │
          │  - Free: 10 créditos/mês    │
          │  - Recursos limitados       │
          └─────────────────────────────┘
                         ↓
          ┌─────────────────────────────┐
          │    PLANO FREE PERMANENTE    │
          │  (Até fazer upgrade manual) │
          └─────────────────────────────┘
```

---

## 📁 Arquivos Criados

### **Migrations SQL** (No banco de dados)

1. **`20260120000001_trial_system.sql`**
   - Cria sistema de trial (7 dias)
   - Adiciona colunas: trial_status, trial_start_date, trial_end_date
   - Atualiza usuários existentes

2. **`20260120000002_fix_user_data_inconsistencies.sql`**
   - Corrige dados inconsistentes
   - Sincroniza plan e subscription_tier
   - Trigger de sincronização

3. **`20260120000003_fix_whatsapp_on_signup.sql`**
   - Corrige campo whatsapp no signup
   - Atualiza trigger para capturar whatsapp

4. **`20260120000004_force_fix_trial_users.sql`**
   - Correção forçada para trials expirados
   - Mais agressiva que a #2

5. **`20260120000005_auto_expire_trials.sql`** ⭐ **PRINCIPAL**
   - Cria cron job automático
   - Função expire_trial_subscriptions()
   - Função check_and_expire_user_trial()
   - Tabela de logs
   - View de monitoramento

### **Código Frontend**

1. **`src/contexts/AuthContext.tsx`**
   - Função checkAndExpireTrial()
   - Verifica trial ao buscar perfil
   - Garante dados corretos no login

### **Documentação**

1. **`MIGRATION_GUIDE.md`**
   - Guia de aplicação das migrations
   - Passo a passo

2. **`FIX_9999_CREDITS.md`**
   - Solução para problema de 9999 créditos
   - Debug e correções

3. **`AUTO_EXPIRE_TRIALS.md`**
   - Como funciona o sistema automático
   - Monitoramento e troubleshooting

4. **`VALIDATE_USERS.sql`**
   - Queries de diagnóstico
   - Validação de dados

5. **`DEBUG_USER.sql`**
   - Debug de usuário específico
   - Identifica problemas

---

## 🚀 Como Aplicar (Passo a Passo)

### Passo 1: Aplicar Migrations

No **Supabase Dashboard → SQL Editor**, execute **NA ORDEM**:

```sql
-- 1. Sistema de Trial (se ainda não aplicou)
-- Execute: 20260120000001_trial_system.sql

-- 2. Correção de Inconsistências
-- Execute: 20260120000002_fix_user_data_inconsistencies.sql

-- 3. Correção WhatsApp
-- Execute: 20260120000003_fix_whatsapp_on_signup.sql

-- 4. Correção Forçada (se usuários ainda tiverem 9999 créditos)
-- Execute: 20260120000004_force_fix_trial_users.sql

-- 5. SISTEMA AUTOMÁTICO ⭐
-- Execute: 20260120000005_auto_expire_trials.sql
```

### Passo 2: Verificar pg_cron

Se a migration #5 der erro em `CREATE EXTENSION pg_cron`:

1. **Supabase Dashboard → Database → Extensions**
2. Procure `pg_cron`
3. Clique em **Enable**
4. Execute a migration #5 novamente

### Passo 3: Verificar Cron Job

```sql
SELECT * FROM cron.job WHERE jobname = 'expire-trials-daily';
```

**Resultado esperado**:
```
jobname: expire-trials-daily
schedule: 0 0 * * *
active: t
```

Se `active = t` → ✅ **Funcionando!**

### Passo 4: Testar (Opcional)

```sql
-- Executar manualmente
SELECT * FROM expire_trial_subscriptions();

-- Ver resultado
SELECT * FROM trial_expiration_logs ORDER BY executed_at DESC LIMIT 1;
```

---

## 📊 Monitoramento

### Ver trials ativos

```sql
SELECT * FROM active_trials_monitor;
```

### Ver logs do cron

```sql
SELECT
  executed_at,
  trials_expired,
  users_downgraded,
  status
FROM trial_expiration_logs
ORDER BY executed_at DESC
LIMIT 10;
```

### Ver próxima execução do cron

```sql
SELECT
  jobname,
  schedule,
  command,
  active
FROM cron.job
WHERE jobname = 'expire-trials-daily';
```

---

## ✅ Checklist Final

- [ ] Migration #1 aplicada (Trial System)
- [ ] Migration #2 aplicada (Fix Inconsistencies)
- [ ] Migration #3 aplicada (Fix WhatsApp)
- [ ] Migration #4 aplicada (Force Fix - se necessário)
- [ ] Migration #5 aplicada ⭐ (Auto-Expire System)
- [ ] pg_cron habilitado
- [ ] Cron job agendado (`active = t`)
- [ ] Teste manual executado
- [ ] Logs aparecendo
- [ ] Frontend atualizado (AuthContext.tsx)

---

## 🎉 Resultado Final

### **ANTES** ❌
```
Trial expira → Nada acontece → Usuário fica com 9999 créditos →
Você precisa rodar migration manualmente toda vez
```

### **AGORA** ✅
```
Trial expira → Cron detecta (00:00 UTC) → Downgrade automático →
OU
Usuário faz login → checkAndExpireTrial() → Downgrade imediato →

Resultado: 10 créditos, plano Free
Você NÃO precisa fazer NADA! 🎉
```

---

## 🆘 Suporte

Se algo não funcionar:

1. Execute `DEBUG_USER.sql` para o usuário problemático
2. Verifique logs: `SELECT * FROM trial_expiration_logs`
3. Verifique cron: `SELECT * FROM cron.job`
4. Consulte `AUTO_EXPIRE_TRIALS.md` para troubleshooting

---

## 📌 Resumo Executivo

| Item | Status | Automático? |
|------|--------|-------------|
| **Criar trial ao signup** | ✅ Pronto | ✅ Sim (Trigger) |
| **Expirar trial após 7 dias** | ✅ Pronto | ✅ Sim (Cron + Login) |
| **Downgrade para Free** | ✅ Pronto | ✅ Sim (Automático) |
| **Ajustar créditos para 10** | ✅ Pronto | ✅ Sim (Automático) |
| **Monitoramento** | ✅ Pronto | ✅ Sim (Logs + View) |
| **Salvar WhatsApp** | ✅ Pronto | ✅ Sim (Trigger) |

**Você não precisa fazer NADA manualmente!** Tudo é automático. 🚀
