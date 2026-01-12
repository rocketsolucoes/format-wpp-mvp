# Documentação de API - ZapStyle

Esta documentação descreve todas as APIs e Edge Functions disponíveis no ZapStyle.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Autenticação](#autenticação)
- [Edge Functions](#edge-functions)
  - [format-text](#format-text)
  - [format-text-preview](#format-text-preview)
  - [create-checkout](#create-checkout)
  - [create-portal-session](#create-portal-session)
  - [stripe-webhook](#stripe-webhook)
- [Banco de Dados (Supabase)](#banco-de-dados-supabase)
- [Códigos de Erro](#códigos-de-erro)
- [Rate Limiting](#rate-limiting)
- [Exemplos](#exemplos)

---

## 🌐 Visão Geral

Todas as Edge Functions estão hospedadas no Supabase e seguem o padrão:

```
https://[PROJECT_ID].supabase.co/functions/v1/[FUNCTION_NAME]
```

**Base URL**: `https://seu-projeto.supabase.co/functions/v1`

### Headers Padrão

Todas as requisições devem incluir:

```http
Content-Type: application/json
```

Requisições autenticadas devem incluir:

```http
Authorization: Bearer [JWT_TOKEN]
```

### Respostas Padrão

#### Sucesso (200)
```json
{
  "data": { ... },
  "message": "Success"
}
```

#### Erro (4xx/5xx)
```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

---

## 🔐 Autenticação

### Obter Token JWT

Use o Supabase Auth para obter um token:

```typescript
import { supabase } from './lib/supabase';

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Token está em data.session.access_token
const token = data.session?.access_token;
```

### Usar Token nas Requisições

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/format-text`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ text: 'Meu texto' }),
});
```

### Refresh Token

Tokens expiram em 1 hora. O Supabase faz auto-refresh automaticamente:

```typescript
// Configurado no supabase client
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true, // ✅ Habilitado por padrão
  },
});
```

---

## 🚀 Edge Functions

### format-text

Formata texto usando IA para usuários autenticados.

#### Endpoint
```
POST /functions/v1/format-text
```

#### Autenticação
✅ Obrigatória

#### Request Body

```typescript
interface FormatTextRequest {
  text: string;           // Texto a ser formatado (10-5000 caracteres)
  styleId?: string;       // ID do estilo (opcional, default: "professional")
  customPrompt?: string;  // Prompt customizado (admin only)
}
```

#### Response

```typescript
interface FormatTextResponse {
  formatted_text: string;    // Texto formatado
  credits_remaining: number; // Créditos restantes
  tokens_used: number;       // Tokens consumidos da OpenAI
}
```

#### Exemplo

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/format-text`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    text: 'Olá, gostaria de saber mais sobre seus serviços. Vocês trabalham com desenvolvimento web? Quais são os preços?',
    styleId: 'professional',
  }),
});

const data = await response.json();
// {
//   formatted_text: "Olá! 👋\n\n*Gostaria de saber mais sobre seus serviços*\n\n• Vocês trabalham com desenvolvimento web?\n• Quais são os preços?\n\nAguardo retorno!",
//   credits_remaining: 29,
//   tokens_used: 156
// }
```

#### Erros

| Código | Status | Descrição |
|--------|--------|-----------|
| `AUTH_REQUIRED` | 401 | Token JWT inválido ou ausente |
| `NO_CREDITS` | 403 | Usuário sem créditos |
| `VALIDATION_ERROR` | 400 | Texto inválido (< 10 ou > 5000 chars) |
| `SERVER_ERROR` | 500 | Erro interno do servidor |
| `OPENAI_ERROR` | 502 | Erro na API da OpenAI |

#### Rate Limiting
- **Free**: 10 requisições/minuto
- **Pro**: 60 requisições/minuto
- **Enterprise**: 300 requisições/minuto

---

### format-text-preview

Preview de formatação para usuários não autenticados (rate limited).

#### Endpoint
```
POST /functions/v1/format-text-preview
```

#### Autenticação
❌ Não obrigatória

#### Request Body

```typescript
interface FormatTextPreviewRequest {
  text: string; // Texto a ser formatado (10-500 caracteres)
}
```

#### Response

```typescript
interface FormatTextPreviewResponse {
  formatted_text: string; // Texto formatado
}
```

#### Exemplo

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/format-text-preview`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Olá, gostaria de saber mais sobre seus serviços.',
  }),
});

const data = await response.json();
// {
//   formatted_text: "Olá! 👋\n\n*Gostaria de saber mais sobre seus serviços*"
// }
```

#### Limitações

- **Tamanho máximo**: 500 caracteres
- **Rate limit**: 3 requisições por IP a cada 5 minutos
- **Estilo fixo**: Apenas estilo "professional"

#### Erros

| Código | Status | Descrição |
|--------|--------|-----------|
| `VALIDATION_ERROR` | 400 | Texto inválido |
| `RATE_LIMIT_EXCEEDED` | 429 | Limite de requisições excedido |
| `PREVIEW_LIMIT_EXCEEDED` | 400 | Texto maior que 500 caracteres |

---

### create-checkout

Cria uma sessão de checkout do Stripe.

#### Endpoint
```
POST /functions/v1/create-checkout
```

#### Autenticação
✅ Obrigatória

#### Request Body

```typescript
interface CreateCheckoutRequest {
  priceId: string;      // ID do preço no Stripe (ex: "price_pro_monthly")
  successUrl?: string;  // URL de sucesso (opcional)
  cancelUrl?: string;   // URL de cancelamento (opcional)
}
```

#### Response

```typescript
interface CreateCheckoutResponse {
  sessionId: string;   // ID da sessão do Stripe
  url: string;         // URL para redirecionar o usuário
}
```

#### Exemplo

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    priceId: 'price_pro_monthly',
    successUrl: 'https://zapstyle.com/success',
    cancelUrl: 'https://zapstyle.com/cancel',
  }),
});

const data = await response.json();
// {
//   sessionId: "cs_test_...",
//   url: "https://checkout.stripe.com/c/pay/cs_test_..."
// }

// Redirecionar usuário
window.location.href = data.url;
```

#### Price IDs Disponíveis

| Plano | Price ID | Valor |
|-------|----------|-------|
| Pro Monthly | `price_pro_monthly` | R$ 29/mês |
| Pro Yearly | `price_pro_yearly` | R$ 290/ano |
| Enterprise Monthly | `price_enterprise_monthly` | R$ 99/mês |
| Enterprise Yearly | `price_enterprise_yearly` | R$ 990/ano |

#### Erros

| Código | Status | Descrição |
|--------|--------|-----------|
| `AUTH_REQUIRED` | 401 | Token JWT inválido |
| `INVALID_PRICE_ID` | 400 | Price ID inválido |
| `STRIPE_ERROR` | 502 | Erro na API do Stripe |

---

### create-portal-session

Cria uma sessão do Stripe Customer Portal para gerenciar assinatura.

#### Endpoint
```
POST /functions/v1/create-portal-session
```

#### Autenticação
✅ Obrigatória

#### Request Body

```typescript
interface CreatePortalSessionRequest {
  returnUrl?: string; // URL de retorno (opcional)
}
```

#### Response

```typescript
interface CreatePortalSessionResponse {
  url: string; // URL do Customer Portal
}
```

#### Exemplo

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    returnUrl: 'https://zapstyle.com/settings',
  }),
});

const data = await response.json();
// {
//   url: "https://billing.stripe.com/p/session/..."
// }

// Redirecionar usuário
window.location.href = data.url;
```

#### O que o usuário pode fazer no Portal?

- Atualizar método de pagamento
- Ver histórico de faturas
- Cancelar assinatura
- Atualizar plano
- Baixar recibos

#### Erros

| Código | Status | Descrição |
|--------|--------|-----------|
| `AUTH_REQUIRED` | 401 | Token JWT inválido |
| `NO_SUBSCRIPTION` | 400 | Usuário não tem assinatura |
| `STRIPE_ERROR` | 502 | Erro na API do Stripe |

---

### stripe-webhook

Processa eventos do Stripe (uso interno).

#### Endpoint
```
POST /functions/v1/stripe-webhook
```

#### Autenticação
✅ Webhook signature (Stripe)

#### Headers Obrigatórios

```http
Stripe-Signature: [SIGNATURE]
```

#### Eventos Processados

| Evento | Ação |
|--------|------|
| `checkout.session.completed` | Ativa assinatura, atualiza créditos |
| `customer.subscription.updated` | Atualiza status da assinatura |
| `customer.subscription.deleted` | Cancela assinatura, reseta créditos |
| `invoice.payment_succeeded` | Renova créditos mensais |
| `invoice.payment_failed` | Notifica usuário |

#### Exemplo de Payload (checkout.session.completed)

```json
{
  "id": "evt_...",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer": "cus_...",
      "subscription": "sub_...",
      "metadata": {
        "userId": "uuid-..."
      }
    }
  }
}
```

#### Configuração no Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Adicione endpoint: `https://seu-projeto.supabase.co/functions/v1/stripe-webhook`
3. Selecione eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie o Webhook Secret
5. Configure no Supabase: `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 🗄️ Banco de Dados (Supabase)

### Queries Diretas

Você pode fazer queries diretas no banco usando o Supabase client:

#### Buscar Perfil do Usuário

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Buscar Histórico de Formatações

```typescript
const { data, error } = await supabase
  .from('formatting_history')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(10);
```

#### Salvar Formatação Favorita

```typescript
const { error } = await supabase
  .from('formatting_history')
  .update({ is_favorite: true })
  .eq('id', formattingId)
  .eq('user_id', userId);
```

### RPC Functions

Funções PostgreSQL disponíveis:

#### get_user_stats

Retorna estatísticas do usuário.

```typescript
const { data, error } = await supabase
  .rpc('get_user_stats', { p_user_id: userId });

// Retorna:
// {
//   total_formatting: 42,
//   this_month: 15,
//   last_month: 27,
//   favorite_style_id: "professional",
//   favorite_style_name: "Profissional"
// }
```

#### get_daily_usage

Retorna uso diário para gráficos (últimos 30 dias).

```typescript
const { data, error } = await supabase
  .rpc('get_daily_usage', { p_user_id: userId });

// Retorna:
// [
//   { date: "2026-01-01", format_count: 5, token_count: 1250 },
//   { date: "2026-01-02", format_count: 3, token_count: 750 },
//   ...
// ]
```

---

## ⚠️ Códigos de Erro

### Erros de Autenticação (401)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `AUTH_REQUIRED` | Missing authorization header | Adicione header `Authorization: Bearer <token>` |
| `INVALID_TOKEN` | Invalid authentication token | Token expirado ou inválido, faça login novamente |
| `TOKEN_EXPIRED` | Token has expired | Faça refresh do token |

### Erros de Autorização (403)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `NO_CREDITS` | No credits remaining | Usuário precisa fazer upgrade ou aguardar renovação |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions | Usuário não tem permissão (ex: admin only) |

### Erros de Validação (400)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `VALIDATION_ERROR` | Text must be at least 10 characters | Envie texto com 10-5000 caracteres |
| `INVALID_STYLE_ID` | Invalid style ID | Use um styleId válido |
| `INVALID_PRICE_ID` | Invalid price ID | Use um priceId válido |
| `PREVIEW_LIMIT_EXCEEDED` | Preview limited to 500 characters | Texto muito longo para preview |

### Erros de Rate Limiting (429)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `RATE_LIMIT_EXCEEDED` | Too many requests | Aguarde alguns minutos |
| `DAILY_LIMIT_EXCEEDED` | Daily limit exceeded | Aguarde até amanhã ou faça upgrade |

### Erros do Servidor (500)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `SERVER_ERROR` | Internal server error | Tente novamente, se persistir contate suporte |
| `OPENAI_ERROR` | OpenAI API error | Erro na API da OpenAI, tente novamente |
| `STRIPE_ERROR` | Stripe API error | Erro no Stripe, tente novamente |
| `DATABASE_ERROR` | Database error | Erro no banco, contate suporte |

---

## 🚦 Rate Limiting

### Limites por Plano

| Plano | Formatações/min | Preview/IP | Daily Limit |
|-------|-----------------|------------|-------------|
| **Preview** | - | 3/5min | - |
| **Free** | 10/min | - | 30/dia |
| **Pro** | 60/min | - | Ilimitado |
| **Enterprise** | 300/min | - | Ilimitado |

### Headers de Rate Limit

Todas as respostas incluem headers de rate limit:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

### Tratando Rate Limit

```typescript
const response = await fetch(url, options);

if (response.status === 429) {
  const resetTime = response.headers.get('X-RateLimit-Reset');
  const waitSeconds = parseInt(resetTime) - Math.floor(Date.now() / 1000);
  
  console.log(`Rate limit exceeded. Wait ${waitSeconds} seconds`);
  
  // Aguardar e tentar novamente
  await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
  return fetch(url, options);
}
```

---

## 📝 Exemplos

### Exemplo Completo: Formatar Texto

```typescript
import { supabase } from './lib/supabase';

async function formatarTexto(texto: string) {
  try {
    // 1. Obter sessão (token)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('Usuário não autenticado');
    }

    // 2. Validar texto
    if (texto.length < 10 || texto.length > 5000) {
      throw new Error('Texto deve ter entre 10 e 5000 caracteres');
    }

    // 3. Chamar Edge Function
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/format-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text: texto,
          styleId: 'professional',
        }),
      }
    );

    // 4. Tratar resposta
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao formatar texto');
    }

    const data = await response.json();
    
    // 5. Retornar resultado
    return {
      textoFormatado: data.formatted_text,
      creditosRestantes: data.credits_remaining,
      tokensUsados: data.tokens_used,
    };
    
  } catch (error) {
    console.error('Erro ao formatar:', error);
    throw error;
  }
}

// Uso
const resultado = await formatarTexto('Meu texto aqui...');
console.log(resultado.textoFormatado);
console.log(`Créditos restantes: ${resultado.creditosRestantes}`);
```

### Exemplo Completo: Criar Checkout

```typescript
async function criarCheckout(priceId: string) {
  try {
    // 1. Obter sessão
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Usuário não autenticado');
    }

    // 2. Criar checkout session
    const response = await fetch(
      `${process.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/success`,
          cancelUrl: `${window.location.origin}/cancel`,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao criar checkout');
    }

    const data = await response.json();
    
    // 3. Redirecionar para Stripe
    window.location.href = data.url;
    
  } catch (error) {
    console.error('Erro ao criar checkout:', error);
    throw error;
  }
}

// Uso
await criarCheckout('price_pro_monthly');
```

---

## 🔗 Links Úteis

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)

---

**Última atualização**: Janeiro 2026
