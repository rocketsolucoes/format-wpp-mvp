# 🔧 Guia de Correção - Validação de Usuários

## 📋 Problemas Identificados

### 1. **Campo WhatsApp não sendo salvo** ❌

**Sintoma**: Usuários fazem cadastro informando o WhatsApp mas o campo fica `NULL` no banco.

**Causa**:
- O trigger `handle_new_user()` cria o perfil automaticamente após signup
- Frontend tentava inserir perfil manualmente DEPOIS do trigger
- Banco rejeitava (chave duplicada)
- Frontend tratava como "perfil já existe" e desistia
- WhatsApp nunca era salvo

**Solução**:
- ✅ Migration `20260120000003_fix_whatsapp_on_signup.sql` atualiza trigger para capturar whatsapp
- ✅ `AuthContext.tsx` agora passa whatsapp no `raw_user_meta_data`
- ✅ Frontend não tenta mais inserir perfil manualmente (deixa o trigger fazer)

---

### 2. **9999 créditos aparecendo para usuários Free** ⚠️

**Sintoma**: Usuário `agnysmarques@ymail.com` vê 9999 créditos mas deveria ter 10.

**Causa**:
- Usuário ainda tem `trial_status = 'active'` OU `subscription_tier = 'pro'`
- Migration anterior (`20260120000001`) só atualiza usuários com `trial_status IS NULL`
- Usuários em trial não foram atualizados

**Solução**:
- ✅ Migration `20260120000002_fix_user_data_inconsistencies.sql` expira trials antigos
- ✅ Downgrade de Pro → Free para trials expirados
- ✅ Ajusta créditos de 9999 → 10 para Free users

---

### 3. **Box de histórico aparece vazio** 📦

**Sintoma**: Box do histórico aparece mas sem conteúdo para usuários Free.

**Causa**:
- Código verifica `subscription_tier === 'pro'` mas bloqueia acesso se não for Pro
- Box renderiza mas conteúdo é bloqueado (linhas 109-111 do History.tsx)

**Solução**:
- ✅ Migration corrige `subscription_tier` para usuários inconsistentes
- ✅ Banner de upgrade aparece corretamente para Free users

---

### 4. **Colunas redundantes: `plan` e `subscription_tier`** 🔄

**Sintoma**: Código usa `plan` em alguns lugares e `subscription_tier` em outros, causando bugs.

**Causa**:
- Tabela `profiles` tem DUAS colunas para a mesma informação
- Algumas queries verificam `plan`, outras `subscription_tier`
- Dados ficam dessincronizados

**Solução**:
- ✅ Migration sincroniza `plan` com `subscription_tier` (usa `subscription_tier` como fonte da verdade)
- ✅ Trigger `sync_plan_and_subscription_tier_trigger` mantém colunas sincronizadas automaticamente
- 💡 **Recomendação futura**: Remover coluna `plan` e usar apenas `subscription_tier`

---

## 🚀 Como Aplicar as Correções

### Passo 1: Validar Estado Atual (Opcional)

No Supabase Dashboard → SQL Editor, execute:

```sql
-- Cole o conteúdo de: supabase/migrations/VALIDATE_USERS.sql
-- Execute as queries para ver o estado atual dos usuários
```

Especialmente a query #6 para ver o usuário `agnysmarques@ymail.com`.

---

### Passo 2: Aplicar Migrations

No Supabase Dashboard → SQL Editor, execute **na ordem**:

#### 2.1. Corrigir Inconsistências de Dados

```sql
-- Execute: supabase/migrations/20260120000002_fix_user_data_inconsistencies.sql
```

Esta migration:
- Expira trials antigos (trial_end_date < NOW)
- Downgrade de Pro → Free para trials expirados
- Sincroniza `plan` e `subscription_tier`
- Ajusta créditos para 10 (Free users)
- Cria trigger para manter colunas sincronizadas

#### 2.2. Corrigir WhatsApp no Signup

```sql
-- Execute: supabase/migrations/20260120000003_fix_whatsapp_on_signup.sql
```

Esta migration:
- Atualiza trigger `handle_new_user()` para capturar whatsapp
- Novos usuários terão whatsapp salvo automaticamente

---

### Passo 3: Testar

1. **Teste 1: Novo cadastro com WhatsApp**
   - Crie novo usuário com whatsapp
   - Verifique que whatsapp foi salvo: `SELECT whatsapp FROM profiles WHERE email = 'teste@email.com'`

2. **Teste 2: Créditos corretos**
   - Usuário `agnysmarques@ymail.com` deve ter:
     - `subscription_tier = 'free'`
     - `plan = 'free'`
     - `credits_remaining = 10`
     - `trial_status = 'expired'` (se trial acabou)

3. **Teste 3: Box de histórico**
   - Usuário Free não deve ver conteúdo do histórico
   - Apenas banner de upgrade deve aparecer

---

## 📊 Queries Úteis

### Ver usuário específico

```sql
SELECT
  email,
  plan,
  subscription_tier,
  credits_remaining,
  trial_status,
  whatsapp
FROM profiles
WHERE email = 'agnysmarques@ymail.com';
```

### Ver todos com inconsistências

```sql
SELECT
  email,
  plan,
  subscription_tier,
  credits_remaining
FROM profiles
WHERE plan != subscription_tier;
```

### Ver trials expirados

```sql
SELECT
  email,
  trial_status,
  trial_end_date,
  subscription_tier,
  credits_remaining
FROM profiles
WHERE trial_status = 'expired';
```

---

## 🏁 Resultado Esperado

Após aplicar as migrations:

### Para `agnysmarques@ymail.com`:
- ✅ `subscription_tier = 'free'`
- ✅ `plan = 'free'`
- ✅ `credits_remaining = 10`
- ✅ `trial_status = 'expired'` (se trial acabou)
- ✅ Box de histórico mostra banner de upgrade

### Para novos usuários:
- ✅ WhatsApp é salvo corretamente
- ✅ Trial de 7 dias ativo (9999 créditos)
- ✅ Após 7 dias → downgrade automático para Free (10 créditos)

### Para todos os usuários:
- ✅ `plan` e `subscription_tier` sempre sincronizados
- ✅ Free users têm exatamente 10 créditos
- ✅ Pro users têm 9999 créditos (ilimitado)

---

## 🔍 Monitoramento

Após aplicar, monitore:

1. **Novos cadastros**: Verificar se whatsapp está sendo salvo
2. **Créditos**: Garantir que Free users têm 10 e Pro users 9999
3. **Trials**: Verificar expiração automática após 7 dias
4. **Sincronização**: `plan` e `subscription_tier` devem sempre ser iguais

---

## ⚠️ Notas Importantes

1. **Migrations são idempotentes**: Você pode executar múltiplas vezes sem problemas
2. **Backup recomendado**: Faça backup do banco antes de aplicar
3. **Ordem importa**: Execute na ordem especificada (002 antes de 003)
4. **Frontend atualizado**: Código do AuthContext.tsx já está corrigido
5. **Usuários existentes**: WhatsApp de usuários antigos permanece NULL (precisam atualizar perfil manualmente)

---

## 📞 Suporte

Se encontrar problemas:

1. Execute `VALIDATE_USERS.sql` e compartilhe os resultados
2. Verifique logs do Supabase (Dashboard → Logs)
3. Verifique console do navegador (erros de signup)
