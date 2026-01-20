# ⚙️ Sistema Automático de Expiração de Trials

## 🎯 Problema Resolvido

Antes você precisaria executar migrations manualmente toda vez que um trial expirasse.

**AGORA É AUTOMÁTICO!** ✨

---

## 🚀 Como Funciona

### **Mecanismo 1: Cron Job Diário** ⏰

Um job roda **automaticamente todos os dias às 00:00 UTC**:

```
00:00 UTC → Verifica trials expirados → Faz downgrade → Ajusta créditos → Registra log
```

**O que ele faz**:
1. ✅ Expira trials onde `trial_end_date < NOW()`
2. ✅ Muda `trial_status` de `'active'` → `'expired'`
3. ✅ Faz downgrade: `subscription_tier` de `'pro'` → `'free'`
4. ✅ Ajusta créditos: `9999` → `10`
5. ✅ Registra execução na tabela `trial_expiration_logs`

**Vantagem**: Totalmente automático, não precisa fazer nada!

---

### **Mecanismo 2: Verificação em Tempo Real** 🔄

Função que pode ser chamada manualmente ou por código:

```sql
-- Executar manualmente para todos os usuários
SELECT * FROM expire_trial_subscriptions();

-- Verificar um usuário específico
SELECT * FROM check_and_expire_user_trial('uuid-do-usuario');
```

**Vantagem**: Expiração instantânea, não precisa esperar o cron!

---

## 📊 Monitoramento

### Ver trials ativos e status

```sql
SELECT * FROM active_trials_monitor;
```

Mostra:
- ✅ Trials ativos
- ⏰ Trials que expiram em < 3 dias
- ⚠️ Trials que expiram em < 24h
- 🚨 Trials que DEVERIAM estar expirados

---

### Ver logs de execução do cron

```sql
SELECT
  executed_at,
  trials_expired,
  users_downgraded,
  credits_adjusted,
  execution_time_ms,
  status
FROM trial_expiration_logs
ORDER BY executed_at DESC
LIMIT 10;
```

Mostra:
- Quando o cron executou
- Quantos trials foram expirados
- Quantos usuários foram downgraded
- Tempo de execução
- Se houve erros

---

## 🔧 Instalação

### Passo 1: Aplicar Migration

No **Supabase Dashboard → SQL Editor**:

```sql
-- Execute: supabase/migrations/20260120000005_auto_expire_trials.sql
-- Cole TODO o conteúdo do arquivo
```

**Importante**: Se der erro no `CREATE EXTENSION IF NOT EXISTS pg_cron`, faça assim:

1. Vá em **Supabase Dashboard → Database → Extensions**
2. Procure por `pg_cron`
3. Clique em **Enable**
4. Execute a migration novamente

---

### Passo 2: Verificar Instalação

```sql
-- Verificar se o cron foi agendado
SELECT * FROM cron.job WHERE jobname = 'expire-trials-daily';
```

**Resultado esperado**:
```
jobid | schedule   | command                                  | nodename  | nodeport | database | username | active | jobname
------+------------+------------------------------------------+-----------+----------+----------+----------+--------+------------------
1     | 0 0 * * *  | SELECT expire_trial_subscriptions();     | localhost | 5432     | postgres | postgres | t      | expire-trials-daily
```

Se aparecer `active = t` → ✅ **Funcionando!**

---

### Passo 3: Testar Manualmente (Opcional)

```sql
-- Executar função manualmente para ver se funciona
SELECT * FROM expire_trial_subscriptions();
```

**Resultado**:
```
trials_expired | users_downgraded | credits_adjusted
---------------+------------------+-----------------
2              | 2                | 0
```

Isso mostra quantos trials foram expirados agora.

---

## 🎯 Casos de Uso

### Caso 1: Trial Expira Durante a Noite

**Cenário**:
- Usuário tem trial que expira 21/01/2026 23:59
- Hoje é 22/01/2026 00:30

**O que acontece**:
1. 00:00 UTC → Cron executa
2. Detecta que `trial_end_date < NOW()`
3. Expira trial automaticamente
4. Usuário acorda com plano Free (10 créditos)

✅ **Totalmente automático!**

---

### Caso 2: Usuário Faz Login com Trial Expirado

**Cenário**:
- Usuário não fez login por 10 dias
- Trial expirou há 3 dias
- Cron não rodou ainda (problema técnico)

**Opção A - Esperar o Cron**:
- Próximo cron às 00:00 UTC vai expirar

**Opção B - Forçar Expiração ao Login** (Implementar no frontend):

```typescript
// No AuthContext.tsx, após buscar perfil:
const checkTrialExpiration = async (userId: string) => {
  const { data } = await supabase.rpc('check_and_expire_user_trial', {
    user_id: userId
  });

  if (data?.was_expired) {
    // Trial foi expirado agora, recarregar perfil
    await fetchUserProfile(userId);
  }
};
```

---

### Caso 3: Executar Manualmente

Se você quiser forçar expiração AGORA (sem esperar o cron):

```sql
-- No Supabase Dashboard
SELECT * FROM expire_trial_subscriptions();
```

Ou via código:

```typescript
// Edge Function ou backend
await supabase.rpc('expire_trial_subscriptions');
```

---

## 📅 Frequência de Execução

### Padrão: Diário (00:00 UTC)

```
Cron: 0 0 * * *
Significa: Minuto 0, Hora 0, Todo dia, Todo mês, Toda semana
```

### Mudar Frequência (Se Necessário)

```sql
-- Exemplo: Executar a cada 6 horas
SELECT cron.schedule(
  'expire-trials-daily',
  '0 */6 * * *',  -- A cada 6 horas
  $$SELECT public.expire_trial_subscriptions();$$
);

-- Exemplo: Executar a cada 1 hora
SELECT cron.schedule(
  'expire-trials-daily',
  '0 * * * *',  -- A cada hora
  $$SELECT public.expire_trial_subscriptions();$$
);
```

---

## 🔍 Troubleshooting

### Cron não está executando?

**1. Verificar se está agendado**:
```sql
SELECT * FROM cron.job WHERE jobname = 'expire-trials-daily';
```

Se não aparecer nada → Migration não rodou corretamente.

**2. Verificar logs do pg_cron**:
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-trials-daily')
ORDER BY start_time DESC
LIMIT 5;
```

**3. Verificar se pg_cron está habilitado**:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

Se não aparecer → Habilite no Dashboard → Extensions.

---

### Trials não estão expirando?

**1. Verificar se há trials para expirar**:
```sql
SELECT * FROM active_trials_monitor WHERE status LIKE '%SHOULD BE EXPIRED%';
```

**2. Executar função manualmente**:
```sql
SELECT * FROM expire_trial_subscriptions();
```

Se retornar `trials_expired = 0` → Não há trials expirados no momento.

**3. Verificar dados do usuário**:
```sql
SELECT trial_status, trial_end_date, NOW() as current_time
FROM profiles
WHERE email = 'usuario@exemplo.com';
```

---

### Logs não aparecem?

```sql
SELECT * FROM trial_expiration_logs ORDER BY executed_at DESC LIMIT 10;
```

Se vazio → Função nunca foi executada.

Execute manualmente uma vez:
```sql
SELECT * FROM expire_trial_subscriptions();
```

---

## ✅ Validação

### Teste Completo (Simular Trial Expirando)

1. **Criar usuário de teste com trial**:
```sql
INSERT INTO profiles (id, email, trial_status, trial_start_date, trial_end_date, subscription_tier, credits_remaining)
VALUES (
  gen_random_uuid(),
  'teste@expire.com',
  'active',
  NOW() - INTERVAL '8 days',  -- Trial começou 8 dias atrás
  NOW() - INTERVAL '1 day',    -- Trial expirou ontem
  'pro',
  9999
);
```

2. **Executar função de expiração**:
```sql
SELECT * FROM expire_trial_subscriptions();
```

Deve retornar:
```
trials_expired | users_downgraded | credits_adjusted
---------------+------------------+-----------------
1              | 1                | 0
```

3. **Verificar se foi downgraded**:
```sql
SELECT subscription_tier, trial_status, credits_remaining
FROM profiles
WHERE email = 'teste@expire.com';
```

Esperado:
```
subscription_tier | trial_status | credits_remaining
------------------+--------------+------------------
free              | expired      | 10
```

4. **Limpar teste**:
```sql
DELETE FROM profiles WHERE email = 'teste@expire.com';
```

---

## 📊 Resumo

### Como Funciona Agora

| Quando | O que acontece | Automático? |
|--------|----------------|-------------|
| **Trial criado** | Usuário ganha 7 dias Pro (9999 créditos) | ✅ Sim (trigger) |
| **Durante trial** | Usuário tem acesso Pro completo | ✅ Sim |
| **Trial expira** | Cron detecta e faz downgrade para Free (10 créditos) | ✅ Sim (00:00 UTC) |
| **Após expiração** | Usuário tem plano Free permanente | ✅ Sim |
| **Novo mês** | Free users mantêm 10 créditos | ❌ Manual (criar migration) |

---

## 🎉 Resultado Final

### Antes (Manual) ❌
```
Trial expira → Nada acontece → Usuário continua com 9999 créditos →
Você precisa rodar migration manualmente
```

### Agora (Automático) ✅
```
Trial expira → Cron detecta (00:00 UTC) → Downgrade automático →
Usuário vê 10 créditos no próximo login
```

---

## 📝 Próximos Passos

1. ✅ Aplicar migration `20260120000005_auto_expire_trials.sql`
2. ✅ Verificar que cron foi agendado
3. ✅ Executar teste manual (opcional)
4. ✅ Monitorar logs nas próximas 24h

**Agora você nunca mais precisa se preocupar com trials expirados!** 🎉
