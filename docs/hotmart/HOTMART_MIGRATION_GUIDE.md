# 🔄 Guia de Migração: Stripe → Hotmart

Este guia detalha o processo completo de migração do sistema de pagamentos de Stripe para Hotmart.

---

## ✅ STATUS ATUAL

### **FASE 1: Frontend - COMPLETO** ✅
- Constantes de preços atualizadas (R$ 24,90 mensal / R$ 273,90 anual)
- Links de checkout Hotmart configurados
- Stripe removido completamente do frontend
- Commit: `835e789` - "feat: Migrar sistema de pagamentos de Stripe para Hotmart"

### **FASE 2: Backend - PRONTO PARA DEPLOY** 🚀
- ✅ Migrations SQL criadas
- ✅ Edge Function webhook criada
- ⏳ Aguardando deploy manual

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar, certifique-se de ter:

- ✅ Produtos criados no Hotmart com links de checkout
- ✅ Conta Hotmart com acesso de desenvolvedor
- ✅ Supabase CLI instalado (`npm install -g supabase`)
- ✅ Credenciais do projeto Supabase
- ✅ Backup do banco de dados (recomendado)

---

## 🗄️ PASSO 1: MIGRATIONS DO BANCO DE DADOS

### **1.1 - Verificar Supabase CLI**

```bash
supabase --version
```

Se não estiver instalado:
```bash
npm install -g supabase
```

### **1.2 - Fazer Login no Supabase**

```bash
supabase login
```

### **1.3 - Linkar com seu Projeto**

```bash
supabase link --project-ref tfuexkcmtcootolhuroq
```

### **1.4 - Aplicar as Migrations**

**IMPORTANTE:** As migrations estão em ordem sequencial. Execute na ordem correta:

```bash
# 1. Remover estrutura Stripe
supabase db push --include-all

# Ou aplique manualmente cada migration:
supabase db execute --file supabase/migrations/20260115000001_remove_stripe_structure.sql

# 2. Criar estrutura Hotmart
supabase db execute --file supabase/migrations/20260115000002_create_hotmart_structure.sql
```

### **1.5 - Verificar se as tabelas foram criadas**

Acesse o Supabase Dashboard → SQL Editor e execute:

```sql
-- Verificar tabelas Hotmart
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'hotmart%';

-- Deve retornar:
-- hotmart_customers
-- hotmart_subscriptions
-- hotmart_transactions

-- Verificar se tabelas Stripe foram removidas
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'stripe%';

-- Deve retornar 0 resultados
```

---

## ⚡ PASSO 2: DEPLOY DA EDGE FUNCTION

### **2.1 - Deploy da função hotmart-webhook**

```bash
supabase functions deploy hotmart-webhook
```

### **2.2 - Configurar variáveis de ambiente**

As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são configuradas automaticamente pelo Supabase.

Se precisar de variáveis adicionais do Hotmart (como secrets para validação), configure:

```bash
# Exemplo (apenas se necessário):
supabase secrets set HOTMART_CLIENT_ID=your_client_id
supabase secrets set HOTMART_CLIENT_SECRET=your_client_secret
```

### **2.3 - Obter URL da Edge Function**

Após o deploy, a URL será algo como:
```
https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/hotmart-webhook
```

**Anote esta URL** - você vai precisar dela no próximo passo!

---

## 🔗 PASSO 3: CONFIGURAR WEBHOOK NO HOTMART

### **3.1 - Acessar o Painel do Hotmart**

1. Acesse [https://app.hotmart.com](https://app.hotmart.com)
2. Vá em: **Produtos** → Selecione seu produto → **Ferramentas** → **Webhook**

### **3.2 - Configurar o Webhook**

**URL do Webhook:**
```
https://tfuexkcmtcootolhuroq.supabase.co/functions/v1/hotmart-webhook
```

**Eventos para ativar:**
- ✅ PURCHASE_COMPLETE
- ✅ PURCHASE_APPROVED
- ✅ PURCHASE_CANCELED
- ✅ PURCHASE_REFUNDED
- ✅ SUBSCRIPTION_CANCELLATION
- ✅ SUBSCRIPTION_REACTIVATION

**Formato:** JSON

**Versão:** 2.0 (recomendado)

### **3.3 - Testar o Webhook**

O Hotmart oferece um botão "Testar" que envia um evento de exemplo. Use-o para verificar se está funcionando!

---

## 🧹 PASSO 4: REMOVER EDGE FUNCTIONS ANTIGAS DO STRIPE

Agora que o Hotmart está funcionando, remova as funções antigas:

```bash
# Deletar Edge Functions do Stripe
supabase functions delete create-checkout
supabase functions delete create-portal-session
supabase functions delete stripe-webhook
```

**ATENÇÃO:** Só faça isso DEPOIS de confirmar que o Hotmart está funcionando!

---

## 🧪 PASSO 5: TESTAR O FLUXO COMPLETO

### **5.1 - Teste Local (desenvolvimento)**

```bash
# Instalar dependências
npm install

# Rodar servidor local
npm run dev
```

Acesse: http://localhost:5173

### **5.2 - Fluxo de Teste**

1. **Cadastrar usuário** → `/auth`
2. **Ir para página de preços** → `/pricing`
3. **Clicar em "Assinar o Pro"**
4. **Verificar:**
   - ✅ Redireciona para Hotmart
   - ✅ Email pré-preenchido
   - ✅ Nome pré-preenchido (se disponível)

5. **Fazer um pagamento de teste** (use ambiente sandbox do Hotmart)

6. **Verificar no banco de dados:**

```sql
-- Verificar se cliente foi criado
SELECT * FROM hotmart_customers WHERE email = 'seu-email@teste.com';

-- Verificar se assinatura foi criada
SELECT * FROM hotmart_subscriptions
JOIN hotmart_customers ON hotmart_subscriptions.customer_id = hotmart_customers.id
WHERE hotmart_customers.email = 'seu-email@teste.com';

-- Verificar se profile foi atualizado
SELECT id, email, plan, subscription_status FROM profiles
WHERE email = 'seu-email@teste.com';
```

**Resultado esperado:**
- `plan` = `'pro'`
- `subscription_status` = `'active'`

---

## 📊 PASSO 6: VERIFICAR WEBHOOK LOGS

### **6.1 - Ver logs da Edge Function**

```bash
supabase functions logs hotmart-webhook --follow
```

### **6.2 - Verificar no Dashboard**

Dashboard Supabase → Edge Functions → hotmart-webhook → Logs

**O que procurar:**
- ✅ Eventos recebidos corretamente
- ✅ Usuário encontrado por email
- ✅ Dados salvos no banco
- ❌ Erros (se houver)

---

## 🔄 PASSO 7: DEPLOY DO FRONTEND

### **7.1 - Build de produção**

```bash
npm run build
```

### **7.2 - Deploy (Vercel)**

Se estiver usando Vercel:

```bash
vercel --prod
```

Ou use o GitHub Actions configurado no repositório.

### **7.3 - Verificar variáveis de ambiente**

Certifique-se de que as variáveis estão configuradas na Vercel:

```env
VITE_SUPABASE_URL=https://tfuexkcmtcootolhuroq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🐛 TROUBLESHOOTING

### **Problema: Webhook não está sendo chamado**

**Solução:**
1. Verificar URL do webhook no painel Hotmart
2. Testar usando o botão "Testar" do Hotmart
3. Verificar logs da Edge Function
4. Verificar CORS headers (já configurado na função)

### **Problema: Usuário não encontrado**

**Causa:** Email do Hotmart diferente do cadastrado no sistema

**Solução:**
- Usuário deve usar o **mesmo email** no Hotmart e no ZapStyle
- Ou implementar lógica de matching por CPF/documento

### **Problema: Profile não está sendo atualizado**

**Solução:**
1. Verificar se coluna `plan` existe na tabela `profiles`:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('plan', 'subscription_status', 'subscription_tier');
```

2. Se não existir, adicionar manualmente:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status text;
```

### **Problema: Transação duplicada**

**Causa:** Hotmart enviou o mesmo webhook múltiplas vezes

**Solução:** Já tratado! A função usa `UPSERT` com `onConflict: 'transaction'` para evitar duplicatas.

---

## 📈 MONITORAMENTO

### **Queries úteis para monitoramento:**

```sql
-- Total de clientes Hotmart
SELECT COUNT(*) FROM hotmart_customers;

-- Assinaturas ativas
SELECT COUNT(*) FROM hotmart_subscriptions WHERE status = 'active';

-- Receita total (últimos 30 dias)
SELECT
  SUM(amount_total) as total_revenue,
  COUNT(*) as total_transactions
FROM hotmart_transactions
WHERE purchase_date > NOW() - INTERVAL '30 days'
AND status = 'approved';

-- Usuários Pro
SELECT COUNT(*) FROM profiles WHERE plan = 'pro';
```

---

## 🎯 CHECKLIST FINAL

Antes de considerar a migração completa:

- [ ] Migrations aplicadas com sucesso
- [ ] Edge Function `hotmart-webhook` deployed
- [ ] Webhook configurado no painel Hotmart
- [ ] Teste de compra realizado com sucesso
- [ ] Profile atualizado para `plan = 'pro'`
- [ ] Logs sem erros
- [ ] Edge Functions antigas do Stripe removidas
- [ ] Frontend deployed em produção
- [ ] Documentação atualizada

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verificar logs:** `supabase functions logs hotmart-webhook`
2. **Verificar banco:** Use o SQL Editor do Supabase Dashboard
3. **Verificar webhook:** Painel Hotmart → Produtos → Webhook → Histórico

---

## 🔐 SEGURANÇA

### **Recomendações:**

1. **Validar webhook signature** (adicionar no futuro):
```typescript
// No início da Edge Function
const hotmartSignature = req.headers.get('X-Hotmart-Hottok');
// Validar assinatura usando secret do Hotmart
```

2. **Rate limiting:** Considere adicionar rate limiting na Edge Function

3. **Monitoring:** Configure alertas no Supabase para erros na Edge Function

---

## 📝 PRÓXIMOS PASSOS OPCIONAIS

Após a migração básica estar funcionando:

- [ ] Implementar validação de assinatura do webhook (segurança extra)
- [ ] Criar dashboard de analytics de vendas
- [ ] Implementar emails de notificação (compra, cancelamento)
- [ ] Adicionar relatórios de receita
- [ ] Implementar testes automatizados

---

**Boa sorte com a migração! 🚀**

**Dúvidas?** Verifique os logs e o troubleshooting guide acima.
