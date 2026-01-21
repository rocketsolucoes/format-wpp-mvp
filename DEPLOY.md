# 🚀 Guia de Deploy - Format WPP MVP

## ⚠️ IMPORTANTE: Deploy do Supabase Edge Functions

As mudanças no backend **NÃO entram em vigor automaticamente**. O Supabase Edge Functions roda no servidor do Supabase, portanto você precisa fazer o deploy manual das funções.

### Como fazer deploy das Edge Functions:

```bash
# 1. Instalar o Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login no Supabase
supabase login

# 3. Link com o projeto (apenas a primeira vez)
supabase link --project-ref SEU_PROJECT_REF

# 4. Deploy das functions
supabase functions deploy format-text
```

### Verificar se o deploy funcionou:

Após o deploy, você pode testar formatando um texto na aplicação. Para ver os logs em tempo real:

```bash
supabase functions logs format-text --follow
```

Você deverá ver linhas como:
```
Using prompt from: dynamic
System prompt (first 100 chars): Você é um especialista em formatação de mensagens para WhatsApp...
```

---

## 📝 Mudanças Importantes na v2.0

### Backend (`supabase/functions/format-text/index.ts`)

- ✅ Novo sistema de formatação dinâmica com `intentMode` + `userProfile`
- ✅ Função `buildFinalPrompt()` que gera prompts personalizados
- ✅ Temperatura OpenAI ajustada para 0.1 (maior consistência)
- ✅ Validação de modos PRO (sales, notice) para usuários free
- ✅ Compatibilidade retroativa com sistema antigo (styleId)

### Frontend

- ✅ Sidebar de controles no desktop
- ✅ Controles colapsáveis no mobile
- ✅ Persistência de preferências no localStorage
- ✅ Novo hook `useLocalStorageState`

---

## 🔍 Troubleshooting

### Problema: "Nada mudou na formatação"

**Causa**: O Supabase Functions não foi deployado.

**Solução**: Execute o comando de deploy acima.

---

### Problema: Erro ao fazer deploy

```
Error: Unable to find project ref in local config or flags
```

**Solução**: Execute `supabase link --project-ref SEU_PROJECT_REF`

Encontre seu `PROJECT_REF` em: https://app.supabase.com → Seu Projeto → Settings → General

---

## 📊 Compatibilidade

O sistema mantém compatibilidade com chamadas antigas que usam apenas `styleId`. Isso garante que:

- Histórico antigo continua funcionando
- APIs antigas (se houver) não quebram
- Transição é gradual e sem impacto

---

## 🎯 Próximos Passos Recomendados

1. ✅ Deploy do Supabase Functions
2. ⏳ Testar formatação em produção
3. ⏳ Verificar logs para confirmar que está usando o sistema dinâmico
4. ⏳ Monitorar erros e ajustar conforme necessário

---

**Última atualização**: 2026-01-21
**Versão**: 2.0
