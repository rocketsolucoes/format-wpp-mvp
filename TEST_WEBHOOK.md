# 🧪 TESTES DO WEBHOOK HOTMART

## 📋 PRÉ-REQUISITOS

Antes de testar, certifique-se:
- ✅ Migrations aplicadas (tabelas criadas)
- ✅ Edge Function deployada
- ✅ Webhook configurado no Hotmart
- ✅ Usuário de teste criado no sistema

---

## 🎯 TESTE 1: Webhook Manual (cURL)

### Passo 1: Criar usuário de teste

Execute no SQL Editor:

```sql
-- Verificar se já existe usuário de teste
SELECT id, email, plan, subscription_status
FROM profiles
WHERE email = 'teste@formatwpp.com';

-- Se não existir, você precisa criar via interface
-- (signup no app com este email)
```

### Passo 2: Testar webhook com cURL

**Cole a URL da sua Edge Function aqui:**
```bash
WEBHOOK_URL="https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/hotmart-webhook"
```

**Substitua o email no payload:**
```bash
EMAIL_TESTE="SEU_EMAIL_DE_TESTE@example.com"
```

**Execute o teste:**
```bash
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{
    "id": "test-event-001",
    "creation_date": 1705363200,
    "event": "PURCHASE_COMPLETE",
    "version": "2.0.0",
    "data": {
      "product": {
        "id": 123456,
        "name": "FormatWPP Pro"
      },
      "buyer": {
        "email": "'"$EMAIL_TESTE"'",
        "name": "Usuario Teste"
      },
      "purchase": {
        "transaction": "TEST-TX-001",
        "status": "approved",
        "approved_date": 1705363200,
        "price": {
          "value": 24.90,
          "currency_code": "BRL"
        },
        "payment": {
          "type": "credit_card"
        }
      },
      "subscription": {
        "subscriber_code": "SUB-TEST-001",
        "plan": {
          "id": 1,
          "name": "Mensal"
        },
        "status": "active",
        "date_next_charge": {
          "date": 1707955200
        },
        "date_subscription_start": {
          "date": 1705363200
        },
        "recurrency_period": 30,
        "subscription_id": "SUB-ID-TEST-001"
      }
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "event": "PURCHASE_COMPLETE"
}
```

---

## ✅ TESTE 2: Validar Dados no Banco

Execute no SQL Editor após o teste:

```sql
-- 1. Verificar customer criado
SELECT *
FROM hotmart_customers
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: 1 linha com subscriber_code = 'SUB-TEST-001'

-- 2. Verificar subscription criada
SELECT
  s.*,
  c.email
FROM hotmart_subscriptions s
JOIN hotmart_customers c ON s.customer_id = c.id
WHERE c.email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: 1 linha com status = 'active', plan_id = '1'

-- 3. Verificar transaction registrada
SELECT
  t.*,
  c.email
FROM hotmart_transactions t
JOIN hotmart_customers c ON t.customer_id = c.id
WHERE c.email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: 1 linha com transaction = 'TEST-TX-001', amount_total = 24.90

-- 4. Verificar profile atualizado para Pro
SELECT
  id,
  email,
  plan,
  subscription_status,
  subscription_tier
FROM profiles
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: plan = 'pro', subscription_status = 'active', subscription_tier = 'pro'
```

---

## 🧪 TESTE 3: Cancelamento de Assinatura

```bash
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{
    "id": "test-event-002",
    "creation_date": 1705363300,
    "event": "SUBSCRIPTION_CANCELLATION",
    "version": "2.0.0",
    "data": {
      "product": {
        "id": 123456,
        "name": "FormatWPP Pro"
      },
      "buyer": {
        "email": "'"$EMAIL_TESTE"'",
        "name": "Usuario Teste"
      },
      "purchase": {
        "transaction": "TEST-TX-001",
        "status": "approved"
      },
      "subscription": {
        "subscriber_code": "SUB-TEST-001",
        "status": "canceled",
        "subscription_id": "SUB-ID-TEST-001"
      }
    }
  }'
```

**Validar cancelamento:**
```sql
-- Subscription deve estar canceled
SELECT status
FROM hotmart_subscriptions
WHERE subscription_id = 'SUB-ID-TEST-001';
-- Esperado: 'canceled'

-- Profile deve voltar para free
SELECT plan, subscription_status, credits_remaining
FROM profiles
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: plan = 'free', subscription_status = 'canceled', credits_remaining = 30
```

---

## 🧪 TESTE 4: Reembolso

```bash
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{
    "id": "test-event-003",
    "creation_date": 1705363400,
    "event": "PURCHASE_REFUNDED",
    "version": "2.0.0",
    "data": {
      "product": {
        "id": 123456,
        "name": "FormatWPP Pro"
      },
      "buyer": {
        "email": "'"$EMAIL_TESTE"'",
        "name": "Usuario Teste"
      },
      "purchase": {
        "transaction": "TEST-TX-001",
        "status": "refunded"
      },
      "subscription": {
        "subscriber_code": "SUB-TEST-001",
        "subscription_id": "SUB-ID-TEST-001"
      }
    }
  }'
```

**Validar reembolso:**
```sql
-- Transaction deve estar refunded
SELECT status
FROM hotmart_transactions
WHERE transaction = 'TEST-TX-001';
-- Esperado: 'refunded'

-- Subscription deve estar canceled
SELECT status
FROM hotmart_subscriptions
WHERE subscription_id = 'SUB-ID-TEST-001';
-- Esperado: 'canceled'

-- Profile deve estar free
SELECT plan, subscription_status
FROM profiles
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: plan = 'free', subscription_status = 'canceled'
```

---

## 🧪 TESTE 5: Reativação

```bash
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "X-Hotmart-Hottok: test-token-123" \
  -d '{
    "id": "test-event-004",
    "creation_date": 1705363500,
    "event": "SUBSCRIPTION_REACTIVATION",
    "version": "2.0.0",
    "data": {
      "product": {
        "id": 123456,
        "name": "FormatWPP Pro"
      },
      "buyer": {
        "email": "'"$EMAIL_TESTE"'",
        "name": "Usuario Teste"
      },
      "purchase": {
        "transaction": "TEST-TX-002",
        "status": "approved",
        "approved_date": 1705363500,
        "price": {
          "value": 24.90,
          "currency_code": "BRL"
        }
      },
      "subscription": {
        "subscriber_code": "SUB-TEST-001",
        "status": "active",
        "subscription_id": "SUB-ID-TEST-001"
      }
    }
  }'
```

**Validar reativação:**
```sql
-- Subscription deve estar active novamente
SELECT status
FROM hotmart_subscriptions
WHERE subscription_id = 'SUB-ID-TEST-001';
-- Esperado: 'active'

-- Profile deve estar pro novamente
SELECT plan, subscription_status
FROM profiles
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
-- Esperado: plan = 'pro', subscription_status = 'active'
```

---

## 📊 TESTE 6: Ver Logs da Edge Function

1. Acesse: **https://supabase.com/dashboard/project/tfuexkcmtcootolhuroq/functions/hotmart-webhook/logs**

2. Procure por:
   - ✅ "Received Hotmart webhook" (evento recebido)
   - ✅ "Successfully activated subscription" (sucesso)
   - ❌ Erros (se houver)

---

## 🧹 LIMPAR DADOS DE TESTE

Após testar, limpe os dados de teste:

```sql
-- 1. Buscar IDs
SELECT
  c.id as customer_id,
  c.email
FROM hotmart_customers c
WHERE c.email = 'SEU_EMAIL_DE_TESTE@example.com';

-- 2. Deletar transactions
DELETE FROM hotmart_transactions
WHERE customer_id IN (
  SELECT id FROM hotmart_customers WHERE email = 'SEU_EMAIL_DE_TESTE@example.com'
);

-- 3. Deletar subscriptions
DELETE FROM hotmart_subscriptions
WHERE customer_id IN (
  SELECT id FROM hotmart_customers WHERE email = 'SEU_EMAIL_DE_TESTE@example.com'
);

-- 4. Deletar customer
DELETE FROM hotmart_customers
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';

-- 5. Resetar profile para free
UPDATE profiles
SET
  plan = 'free',
  subscription_status = NULL,
  subscription_tier = 'free',
  credits_remaining = 30
WHERE email = 'SEU_EMAIL_DE_TESTE@example.com';
```

---

## ✅ CHECKLIST DE TESTES

- [ ] Teste 1: PURCHASE_COMPLETE - Customer, Subscription e Transaction criados ✅
- [ ] Teste 1: Profile atualizado para Pro ✅
- [ ] Teste 3: SUBSCRIPTION_CANCELLATION - Subscription cancelada ✅
- [ ] Teste 3: Profile voltou para Free ✅
- [ ] Teste 4: PURCHASE_REFUNDED - Transaction marcada como refunded ✅
- [ ] Teste 5: SUBSCRIPTION_REACTIVATION - Subscription reativada ✅
- [ ] Teste 6: Logs da Edge Function sem erros ✅
- [ ] Limpeza dos dados de teste concluída ✅

---

## 🎉 PRÓXIMO PASSO

Quando os testes passarem, você pode fazer uma **compra real de teste** no Hotmart (em sandbox ou produção) para validar o fluxo completo!
