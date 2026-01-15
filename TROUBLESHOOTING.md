# 🔧 TROUBLESHOOTING - Sistema Hotmart

Guia de resolução de problemas comuns.

---

## 🚨 PROBLEMA 1: Webhook não está sendo chamado

### Sintomas
- Compra realizada no Hotmart
- Nenhum dado aparece no banco
- Sem logs na Edge Function

### Diagnóstico

1. **Verificar configuração do webhook no Hotmart:**
   - Acesse: https://app.hotmart.com
   - Produto → Ferramentas → Webhook
   - Confirme que a URL está correta
   - Confirme que os eventos estão marcados

2. **Testar manualmente:**
   ```bash
   curl -X POST "https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/hotmart-webhook" \
     -H "Content-Type: application/json" \
     -d '{"test": "test"}'
   ```

   Se retornar erro 500, há problema na function.
   Se retornar 200, a function está ok.

3. **Verificar logs da Edge Function:**
   - Acesse: https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/functions/hotmart-webhook/logs
   - Procure por erros

### Solução
- ✅ Reconfigure o webhook no Hotmart
- ✅ Verifique se a URL está acessível
- ✅ Teste com ambiente sandbox primeiro

---

## 🚨 PROBLEMA 2: Erro "User not found"

### Sintomas
- Webhook é chamado
- Logs mostram: "User not found with email: email@example.com"
- Nenhum dado é salvo

### Diagnóstico

```sql
-- Verificar se usuário existe
SELECT id, email, plan
FROM profiles
WHERE email = 'email@example.com';
```

### Causa
O email usado na compra do Hotmart não está registrado no sistema.

### Solução

**Opção 1: Usuário deve se registrar primeiro**
1. Usuário cria conta no app (signup)
2. Depois faz a compra no Hotmart
3. Webhook encontra o email e atualiza o plano

**Opção 2: Criar usuário automaticamente (requer modificação)**
- Modificar o webhook para criar usuário se não existir
- Não recomendado (segurança)

---

## 🚨 PROBLEMA 3: Profile não atualiza para Pro

### Sintomas
- Customer, Subscription e Transaction criados ✅
- Profile continua com plan='free' ❌

### Diagnóstico

```sql
-- Verificar dados criados
SELECT
  c.email,
  s.status,
  t.status,
  p.plan
FROM hotmart_customers c
LEFT JOIN hotmart_subscriptions s ON c.id = s.customer_id
LEFT JOIN hotmart_transactions t ON c.id = t.customer_id
LEFT JOIN profiles p ON c.user_id = p.id
WHERE c.email = 'email@example.com';
```

### Solução

```sql
-- Atualizar manualmente
UPDATE profiles
SET
  plan = 'pro',
  subscription_status = 'active',
  subscription_tier = 'pro'
WHERE email = 'email@example.com';
```

### Prevenção
- Verificar logs da Edge Function para erros
- Confirmar que a transaction está com status='approved'

---

## 🚨 PROBLEMA 4: Erro "Failed to upsert customer"

### Sintomas
- Logs mostram: "Failed to upsert customer: ..."
- Webhook retorna erro 500

### Diagnóstico

```sql
-- Verificar constraints da tabela
SELECT
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'hotmart_customers'::regclass;
```

### Causas Comuns

1. **Violação de UNIQUE constraint (user_id):**
   - Customer já existe para este user_id
   - Mas subscriber_code é diferente

2. **Violação de UNIQUE constraint (subscriber_code):**
   - Subscriber_code já existe
   - Mas para user_id diferente

### Solução

```sql
-- Ver conflitos
SELECT
  user_id,
  subscriber_code,
  email,
  COUNT(*)
FROM hotmart_customers
GROUP BY user_id, subscriber_code, email
HAVING COUNT(*) > 1;

-- Deletar duplicados se necessário
DELETE FROM hotmart_customers
WHERE id NOT IN (
  SELECT MIN(id)
  FROM hotmart_customers
  GROUP BY user_id
);
```

---

## 🚨 PROBLEMA 5: Assinatura cancelada mas user continua Pro

### Sintomas
- Subscription com status='canceled' ✅
- Profile com plan='pro' ❌

### Diagnóstico

```sql
SELECT
  p.email,
  p.plan,
  p.subscription_status,
  s.status as subscription_db_status
FROM profiles p
JOIN hotmart_customers c ON p.id = c.user_id
JOIN hotmart_subscriptions s ON c.id = s.customer_id
WHERE p.email = 'email@example.com';
```

### Solução

```sql
-- Forçar downgrade para free
UPDATE profiles
SET
  plan = 'free',
  subscription_status = 'canceled',
  subscription_tier = 'free',
  credits_remaining = 30
WHERE email = 'email@example.com';
```

---

## 🚨 PROBLEMA 6: Erro de CORS no webhook

### Sintomas
- Frontend mostra erro de CORS
- Webhook funciona via cURL mas não via browser

### Causa
CORS headers não configurados corretamente.

### Solução

A Edge Function já tem CORS configurado:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

Se ainda houver erro:
1. Verificar se a request OPTIONS está retornando 200
2. Confirmar headers na response

---

## 🚨 PROBLEMA 7: Duplicação de dados

### Sintomas
- Múltiplos customers para o mesmo user_id
- Múltiplas subscriptions ativas

### Diagnóstico

```sql
-- Encontrar duplicados
SELECT
  user_id,
  COUNT(*) as customer_count
FROM hotmart_customers
GROUP BY user_id
HAVING COUNT(*) > 1;

SELECT
  customer_id,
  COUNT(*) as subscription_count
FROM hotmart_subscriptions
WHERE status = 'active'
GROUP BY customer_id
HAVING COUNT(*) > 1;
```

### Solução

```sql
-- Manter apenas o mais recente
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM hotmart_customers
)
DELETE FROM hotmart_customers
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);
```

---

## 🚨 PROBLEMA 8: Transaction não registrada

### Sintomas
- Customer e Subscription criados ✅
- Transaction não aparece no banco ❌

### Diagnóstico

```sql
-- Verificar se há transaction
SELECT
  t.*
FROM hotmart_transactions t
JOIN hotmart_customers c ON t.customer_id = c.id
WHERE c.email = 'email@example.com';
```

### Solução

Verificar logs da Edge Function:
- Procurar por erro em "Failed to record transaction"
- Verificar se `purchase.transaction` está vindo no payload

---

## 🚨 PROBLEMA 9: Edge Function timeout

### Sintomas
- Webhook demora muito para responder
- Timeout após 30 segundos
- Dados parcialmente salvos

### Diagnóstico

Ver logs da Edge Function para identificar qual parte está lenta.

### Solução

1. **Verificar índices:**
   ```sql
   -- Todos os índices devem existir
   SELECT indexname
   FROM pg_indexes
   WHERE tablename LIKE 'hotmart%';
   ```

2. **Otimizar queries:**
   - Já otimizado: busca de profile por email usa índice
   - Upserts são atômicos

3. **Aumentar timeout** (se necessário):
   - Edge Functions Supabase têm timeout padrão de 60s
   - Pode ser aumentado nas configurações

---

## 🚨 PROBLEMA 10: Inconsistência de dados

### Sintomas
- Dados não batem entre tabelas
- User Pro sem subscription ativa
- Subscription ativa sem transaction

### Diagnóstico

Execute todas as queries de "ALERTAS" em `MONITORING_QUERIES.sql`:

```sql
-- Usuários Pro sem subscription ativa
SELECT p.email, p.plan, COUNT(s.id) as active_subs
FROM profiles p
LEFT JOIN hotmart_customers c ON p.id = c.user_id
LEFT JOIN hotmart_subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE p.plan = 'pro'
GROUP BY p.id, p.email, p.plan
HAVING COUNT(s.id) = 0;

-- Subscriptions ativas sem transaction
SELECT s.subscription_id, c.email
FROM hotmart_subscriptions s
JOIN hotmart_customers c ON s.customer_id = c.id
LEFT JOIN hotmart_transactions t ON c.id = t.customer_id
WHERE s.status = 'active' AND t.id IS NULL;
```

### Solução

Sincronizar manualmente conforme necessário.

---

## 📊 QUERIES ÚTEIS PARA DEBUG

### Ver últimos eventos processados
```sql
SELECT
  created_at,
  email,
  subscriber_code
FROM hotmart_customers
ORDER BY created_at DESC
LIMIT 10;
```

### Ver logs de erro (se houver tabela de logs)
```sql
-- Na Edge Function, logs ficam no Dashboard
-- Acesse: Functions → hotmart-webhook → Logs
```

### Verificar saúde geral do sistema
```sql
SELECT
  (SELECT COUNT(*) FROM hotmart_customers) as customers,
  (SELECT COUNT(*) FROM hotmart_subscriptions WHERE status='active') as active_subs,
  (SELECT COUNT(*) FROM hotmart_transactions) as transactions,
  (SELECT COUNT(*) FROM profiles WHERE plan='pro') as pro_users;
```

---

## 🆘 SUPORTE

Se o problema persistir:

1. **Colete informações:**
   - Email do usuário afetado
   - Data/hora da compra
   - Transaction ID do Hotmart
   - Logs da Edge Function
   - Resultado das queries de diagnóstico

2. **Verifique documentação:**
   - `MONITORING_QUERIES.sql` - Queries de monitoramento
   - `TEST_WEBHOOK.md` - Testes do webhook
   - `MIGRATION_SUMMARY.md` - Resumo da migração

3. **Teste em ambiente controlado:**
   - Use `TEST_WEBHOOK.md` para reproduzir o problema
   - Teste com dados fake primeiro

---

## ✅ CHECKLIST DE SAÚDE DO SISTEMA

Execute periodicamente:

- [ ] Todas as tabelas existem (3 tabelas Hotmart)
- [ ] RLS policies estão ativas (3 policies)
- [ ] Índices estão criados (~9 índices)
- [ ] Edge Function está deployada e acessível
- [ ] Webhook configurado no Hotmart
- [ ] Sem erros nos logs da Edge Function (últimas 24h)
- [ ] Sem inconsistências nos dados (queries de alerta)
- [ ] MRR bate com subscriptions ativas
- [ ] Todos os Pro users têm subscription ativa
