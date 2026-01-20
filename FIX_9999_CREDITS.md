# 🔧 Correção: Usuário com 9999 Créditos

## 🎯 Problema

Usuário `agnysmarques@ymail.com` ainda mostra **9999 créditos** mesmo após aplicar as migrations.

---

## 🔍 Diagnóstico

### Passo 1: Execute o arquivo de debug

No **Supabase Dashboard → SQL Editor**, execute:

```sql
-- Cole TODO o conteúdo de: supabase/migrations/DEBUG_USER.sql
```

Este arquivo vai mostrar:
1. ✅ Todos os dados do usuário
2. ✅ Status do trial (ativo, expirado, sem trial)
3. ✅ Se as migrations deveriam ter funcionado
4. ✅ Se as migrations foram executadas

---

## 📊 Interpretando os Resultados

### Cenário A: Trial ainda está ATIVO ⏳

**Sintomas no debug**:
```
trial_status = 'active'
trial_end_date = '2026-01-25' (data no FUTURO)
days_until_expiry = 5 (positivo)
```

**Motivo**: O trial de 7 dias ainda não expirou!

**Solução**: O usuário tem créditos ilimitados até `trial_end_date`. Isso é o comportamento esperado.

**Opções**:
1. ⏰ **Aguardar** até `trial_end_date` (migration automática expirará o trial)
2. 🔨 **Forçar expiração** agora (use a query de correção manual)

---

### Cenário B: Trial EXPIRADO mas não foi downgraded 🐛

**Sintomas no debug**:
```
trial_status = 'expired'
subscription_tier = 'pro' (ainda Pro!)
credits_remaining = 9999
```

**Motivo**: Migration #2 não executou corretamente.

**Solução**: Execute a migration #4 (force fix)

---

### Cenário C: Trial deveria estar EXPIRADO mas está ATIVO 🐛

**Sintomas no debug**:
```
trial_status = 'active'
trial_end_date = '2026-01-10' (data no PASSADO)
days_until_expiry = -10 (negativo!)
```

**Motivo**: Trial passou da data mas não foi expirado.

**Solução**: Execute a migration #4 (force fix)

---

### Cenário D: Migrations NÃO foram executadas ⚠️

**Sintomas no debug**:
```
Query #4 retorna VAZIO ou não mostra version '20260120000002'
```

**Motivo**: Você não executou as migrations no Supabase!

**Solução**: Execute as migrations na ordem correta (veja abaixo)

---

## 🛠️ Soluções

### Solução 1: Execute a Migration #4 (Correção Forçada) 🔨

Esta migration é mais agressiva e corrige TODOS os casos:

**No Supabase Dashboard → SQL Editor**:

```sql
-- Execute: supabase/migrations/20260120000004_force_fix_trial_users.sql
-- Cole TODO o conteúdo do arquivo
```

Esta migration:
- ✅ Expira trials com `trial_end_date < NOW()`
- ✅ Expira trials com mais de 7 dias (independente da data)
- ✅ Faz downgrade de TODOS os trials expirados para Free
- ✅ Ajusta créditos para 10
- ✅ Mostra log detalhado dos resultados

**Depois de executar**, você verá mensagens como:
```
NOTICE:  Expired 1 trial(s) based on trial_end_date
NOTICE:  Downgraded 1 expired trial user(s) to Free plan
NOTICE:  ==============================================
NOTICE:  Migration completed successfully!
NOTICE:  Active trials: 0
NOTICE:  Expired trials: 1
NOTICE:  Free users: 1
```

---

### Solução 2: Correção Manual (Específica para um usuário) 🎯

Se você quer corrigir APENAS o `agnysmarques@ymail.com`:

**No Supabase Dashboard → SQL Editor**:

```sql
-- Correção manual para agnysmarques@ymail.com
UPDATE profiles
SET
  trial_status = 'expired',
  plan = 'free',
  subscription_tier = 'free',
  credits_remaining = 10,
  updated_at = NOW()
WHERE email = 'agnysmarques@ymail.com'
  -- Remova esta condição se quiser forçar mesmo com trial ativo
  AND (trial_end_date < NOW() OR trial_start_date < (NOW() - INTERVAL '7 days'));

-- Verificar resultado
SELECT
  email,
  subscription_tier,
  credits_remaining,
  trial_status,
  trial_end_date
FROM profiles
WHERE email = 'agnysmarques@ymail.com';
```

**Resultado esperado**:
```
email: agnysmarques@ymail.com
subscription_tier: free
credits_remaining: 10
trial_status: expired
```

---

### Solução 3: Forçar Expiração IMEDIATA (qualquer trial) ⚡

Se você quer expirar o trial AGORA (mesmo que trial_end_date seja futuro):

```sql
-- ATENÇÃO: Isto vai expirar o trial IMEDIATAMENTE
UPDATE profiles
SET
  trial_status = 'expired',
  trial_end_date = NOW(),
  plan = 'free',
  subscription_tier = 'free',
  credits_remaining = 10,
  updated_at = NOW()
WHERE email = 'agnysmarques@ymail.com';
```

⚠️ **Use com cuidado**: Isso vai cancelar o trial mesmo se ainda estiver dentro dos 7 dias!

---

## ✅ Validação Final

Após aplicar qualquer solução, verifique:

### 1. No Banco de Dados

```sql
SELECT
  email,
  subscription_tier,
  plan,
  credits_remaining,
  trial_status,
  trial_start_date,
  trial_end_date
FROM profiles
WHERE email = 'agnysmarques@ymail.com';
```

**Esperado**:
- ✅ `subscription_tier = 'free'`
- ✅ `plan = 'free'`
- ✅ `credits_remaining = 10`
- ✅ `trial_status = 'expired'`

### 2. No Frontend

1. **Limpe o cache**:
   - Ctrl + Shift + R (hard reload)
   - Ou abra uma aba anônima

2. **Faça login** com `agnysmarques@ymail.com`

3. **Verifique**:
   - Créditos devem mostrar: **10** (não 9999)
   - Badge do plano: **Free** (não Pro)
   - Histórico: Deve mostrar banner de upgrade

---

## 🔄 Se Ainda Não Funcionar

### 1. Verifique o cache do AuthContext

O frontend pode estar cacheando os dados do usuário. Execute no console do navegador:

```javascript
// Limpar localStorage
localStorage.clear();

// Recarregar página
location.reload();
```

### 2. Verifique a query do AuthContext

O `AuthContext.tsx` linha 77-99 busca o perfil assim:

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

Se os dados estiverem corretos no banco mas errados no frontend, o problema é cache.

### 3. Force um novo login

```sql
-- No Supabase: Force logout do usuário
DELETE FROM auth.sessions
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'agnysmarques@ymail.com');
```

Depois peça ao usuário para fazer login novamente.

---

## 📋 Checklist de Execução

Execute nesta ordem:

- [ ] 1. Executar `DEBUG_USER.sql` e identificar o cenário
- [ ] 2. Executar `20260120000004_force_fix_trial_users.sql`
- [ ] 3. Verificar resultado no banco (`SELECT * FROM profiles WHERE email = ...`)
- [ ] 4. Limpar cache do navegador (Ctrl + Shift + R)
- [ ] 5. Fazer login novamente
- [ ] 6. Verificar créditos no frontend (deve ser 10)
- [ ] 7. Verificar badge do plano (deve ser Free)

---

## 🆘 Ainda com Problemas?

Se após todos os passos o usuário ainda tiver 9999 créditos:

1. Cole o resultado completo do `DEBUG_USER.sql`
2. Cole o log da migration #4
3. Cole o resultado de:
   ```sql
   SELECT * FROM profiles WHERE email = 'agnysmarques@ymail.com';
   ```
4. Cole o console do navegador (F12 → Console)

---

## 📌 Notas Importantes

- ⚡ **Migration #4 é segura**: Pode executar múltiplas vezes
- 🎯 **Não afeta Pro users reais**: Apenas usuários com `trial_status` são afetados
- 🔄 **Idempotente**: Executar 2x não causa problemas
- 💾 **Backup**: Sempre recomendado antes de migrations
