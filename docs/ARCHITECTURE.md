# Arquitetura do ZapStyle

Este documento descreve a arquitetura técnica do ZapStyle, incluindo decisões de design, fluxos de dados e padrões utilizados.

## 📐 Visão Geral

O ZapStyle é construído como uma **Single Page Application (SPA)** moderna com backend serverless, seguindo uma arquitetura de três camadas:

1. **Frontend (React SPA)** - Interface do usuário
2. **Backend (Supabase)** - Banco de dados, autenticação e Edge Functions
3. **Integrações Externas** - OpenAI, Stripe

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React 18 + TypeScript + TailwindCSS + Vite        │   │
│  │  - Components (59)                                   │   │
│  │  - Pages (11)                                        │   │
│  │  - Contexts (Auth, Theme)                           │   │
│  │  - Services (API calls)                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │  Auth        │  │  Edge Funcs  │     │
│  │  + RLS       │  │  (JWT)       │  │  (Deno)      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  INTEGRAÇÕES EXTERNAS                       │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  OpenAI API  │  │  Stripe API  │                        │
│  │  (GPT-4)     │  │  (Payments)  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Princípios de Arquitetura

### 1. Separação de Responsabilidades
Cada camada tem responsabilidades bem definidas e não conhece detalhes de implementação das outras camadas.

### 2. Serverless First
Utilizamos serviços serverless (Supabase Edge Functions, Vercel) para reduzir complexidade operacional e custos.

### 3. Security by Design
Segurança é implementada em múltiplas camadas: RLS no banco, validação em frontend e backend, secrets protegidos.

### 4. API First
Toda lógica de negócio sensível é executada server-side via Edge Functions, mantendo o frontend leve e seguro.

### 5. Progressive Enhancement
A aplicação funciona com JavaScript desabilitado para conteúdo estático, e melhora progressivamente com JS habilitado.

---

## 🏗️ Arquitetura Frontend

### Estrutura de Componentes

O frontend segue uma arquitetura baseada em componentes, organizada em camadas:

```
src/
├── components/
│   ├── ui/              # Camada Base (Design System)
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   └── ...
│   ├── [features]/      # Camada de Features
│   │   ├── FormatterInterface.tsx
│   │   ├── DashboardStats.tsx
│   │   └── ...
│   └── [layout]/        # Camada de Layout
│       ├── Header.tsx
│       └── Footer.tsx
├── pages/               # Camada de Páginas
│   ├── Home.tsx
│   ├── Dashboard.tsx
│   └── ...
└── layouts/             # Layouts Compartilhados
    └── DashboardLayout.tsx
```

**Hierarquia de Dependências**:
- **Páginas** → dependem de **Layouts** e **Features**
- **Features** → dependem de **UI Components**
- **UI Components** → não dependem de nada (base)

### Gestão de Estado

Utilizamos uma abordagem híbrida para gestão de estado:

#### Estado Global (Context API)
```typescript
// contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType>();

// Provê: user, loading, signIn, signOut, etc.
```

**Quando usar Context API**:
- Estado compartilhado por múltiplos componentes
- Dados de autenticação
- Preferências do usuário (tema)

#### Estado Local (useState)
```typescript
const [inputText, setInputText] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**Quando usar useState**:
- Estado específico de um componente
- Estados de formulário
- Estados de UI (modals, tooltips)

#### Estado do Servidor (Supabase)
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId);
```

**Quando usar Supabase diretamente**:
- Dados persistidos no banco
- Queries complexas
- Real-time subscriptions (futuro)

### Roteamento

Utilizamos **Wouter** como roteador minimalista:

```typescript
// App.tsx
<Switch>
  <Route path="/" component={Home} />
  <Route path="/auth" component={Auth} />
  
  <Route path="/dashboard">
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  </Route>
</Switch>
```

**Tipos de Rotas**:
- **Públicas**: `/`, `/auth`, `/pricing`
- **Protegidas**: `/dashboard`, `/format`, `/history`, `/settings`
- **Admin**: `/admin/*` (requer role admin)

### Padrões de Componentes

#### 1. Componentes Funcionais com TypeScript
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  loading, 
  onClick 
}) => {
  // ...
};
```

#### 2. Custom Hooks
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### 3. Composition Pattern
```typescript
<Dialog>
  <DialogTrigger>Abrir</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Título</DialogTitle>
    </DialogHeader>
    {/* Conteúdo */}
  </DialogContent>
</Dialog>
```

---

## 🗄️ Arquitetura Backend

### Banco de Dados (PostgreSQL)

O banco de dados é estruturado com foco em segurança e performance:

#### Schema Principal

```sql
-- Perfis de usuário
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  full_name text,
  plan text NOT NULL DEFAULT 'free',
  credits_remaining integer NOT NULL DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

-- Histórico de formatações
CREATE TABLE formatting_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  input_text text NOT NULL,
  output_text text NOT NULL,
  style_id text,
  tokens_used integer,
  created_at timestamptz DEFAULT now()
);

-- Prompts de formatação (admin)
CREATE TABLE formatting_prompts (
  id text PRIMARY KEY,
  name text NOT NULL,
  system_prompt text NOT NULL,
  is_active boolean DEFAULT true
);
```

#### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado para garantir isolamento de dados:

```sql
-- Usuários só acessam seus próprios dados
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own history"
  ON formatting_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

#### Funções PostgreSQL

Funções para agregações e lógica complexa:

```sql
-- Estatísticas do usuário
CREATE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE (
  total_formatting integer,
  this_month integer,
  favorite_style_id text
) AS $$
  -- Implementação
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Edge Functions (Deno)

Edge Functions são executadas próximas aos usuários para baixa latência:

#### 1. format-text
Formatação de texto com IA para usuários autenticados.

**Fluxo**:
1. Valida token JWT
2. Verifica créditos disponíveis
3. Chama OpenAI API
4. Deduz crédito
5. Salva no histórico
6. Retorna texto formatado

```typescript
// supabase/functions/format-text/index.ts
Deno.serve(async (req: Request) => {
  // Autenticação
  const token = req.headers.get("Authorization");
  const { user } = await supabase.auth.getUser(token);
  
  // Validação de créditos
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', user.id)
    .single();
  
  if (profile.credits_remaining <= 0) {
    return new Response(
      JSON.stringify({ error: "No credits" }),
      { status: 403 }
    );
  }
  
  // Formatação com IA
  const formatted = await callOpenAI(text);
  
  // Deduz crédito e salva histórico
  await deductCredit(user.id);
  await saveHistory(user.id, text, formatted);
  
  return new Response(JSON.stringify({ formatted_text: formatted }));
});
```

#### 2. format-text-preview
Preview gratuito sem autenticação (rate limited).

#### 3. create-checkout
Cria sessão de checkout do Stripe.

#### 4. create-portal-session
Cria sessão do Customer Portal do Stripe.

#### 5. stripe-webhook
Processa eventos do Stripe (pagamentos, cancelamentos).

### Autenticação

Autenticação gerenciada pelo Supabase Auth:

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. signIn(email, password)
     ▼
┌────────────────┐
│ Supabase Auth  │
└────┬───────────┘
     │ 2. Valida credenciais
     │ 3. Gera JWT token
     ▼
┌────────────────┐
│  Client        │ 4. Armazena token (localStorage)
│  + JWT Token   │ 5. Inclui em todas as requests
└────────────────┘
```

**Fluxos Suportados**:
- Email/Senha
- Google OAuth
- Reset de senha
- Auto-refresh de token

---

## 🔌 Integrações Externas

### OpenAI API

Integração para formatação de texto com GPT-4:

```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText }
    ],
  }),
});
```

**Configuração**:
- API Key armazenada como secret no Supabase
- Chamada feita server-side (Edge Function)
- Rate limiting implementado
- Fallback para erros

### Stripe API

Integração para pagamentos e assinaturas:

#### Checkout Flow
```
┌──────────┐
│  Client  │
└────┬─────┘
     │ 1. Clica "Assinar Pro"
     ▼
┌────────────────────┐
│ create-checkout    │ 2. Cria Checkout Session
│ (Edge Function)    │
└────┬───────────────┘
     │ 3. Retorna checkout_url
     ▼
┌────────────────────┐
│ Stripe Checkout    │ 4. Usuário paga
└────┬───────────────┘
     │ 5. Webhook event
     ▼
┌────────────────────┐
│ stripe-webhook     │ 6. Atualiza subscription
│ (Edge Function)    │    no banco de dados
└────────────────────┘
```

#### Webhook Events
- `checkout.session.completed` - Pagamento concluído
- `customer.subscription.updated` - Assinatura atualizada
- `customer.subscription.deleted` - Assinatura cancelada
- `invoice.payment_failed` - Falha no pagamento

---

## 🔐 Segurança

### Camadas de Segurança

#### 1. Frontend
- Validação de entrada (10-5000 caracteres)
- Sanitização de dados
- HTTPS obrigatório
- CSP headers (Content Security Policy)

#### 2. Backend (Edge Functions)
- Validação de JWT token
- Validação de entrada duplicada
- Rate limiting
- CORS configurado

#### 3. Banco de Dados
- Row Level Security (RLS)
- Prepared statements (SQL injection prevention)
- Índices para performance

#### 4. Secrets
- Variáveis de ambiente
- Supabase Secrets para Edge Functions
- Nunca commitados no Git

### Fluxo de Autenticação Seguro

```
1. Login
   ↓
2. Supabase gera JWT (expira em 1h)
   ↓
3. Token armazenado em localStorage
   ↓
4. Token incluído em todas as requests (Authorization header)
   ↓
5. Edge Function valida token
   ↓
6. RLS valida acesso aos dados
   ↓
7. Auto-refresh antes de expirar
```

---

## 📊 Fluxos de Dados

### Fluxo de Formatação (Usuário Autenticado)

```
┌──────────────────────────────────────────────────────────┐
│ 1. Usuário digita texto                                  │
│    ↓                                                      │
│ 2. Frontend valida (10-5000 chars)                       │
│    ↓                                                      │
│ 3. Chama Edge Function format-text                       │
│    ├─ Headers: Authorization: Bearer <jwt>               │
│    └─ Body: { text, styleId }                            │
│    ↓                                                      │
│ 4. Edge Function valida JWT                              │
│    ↓                                                      │
│ 5. Verifica créditos no banco                            │
│    ↓                                                      │
│ 6. Chama OpenAI API                                      │
│    ├─ System prompt (estilo)                             │
│    └─ User text                                          │
│    ↓                                                      │
│ 7. OpenAI retorna texto formatado                        │
│    ↓                                                      │
│ 8. Deduz 1 crédito do usuário                            │
│    ↓                                                      │
│ 9. Salva no histórico                                    │
│    ↓                                                      │
│ 10. Retorna para frontend                                │
│     └─ { formatted_text, credits_remaining }             │
│    ↓                                                      │
│ 11. Frontend exibe resultado                             │
│     └─ Preview no estilo WhatsApp                        │
└──────────────────────────────────────────────────────────┘
```

### Fluxo de Pagamento (Stripe)

```
┌──────────────────────────────────────────────────────────┐
│ 1. Usuário clica "Assinar Pro"                           │
│    ↓                                                      │
│ 2. Frontend chama create-checkout                        │
│    ├─ priceId: "price_pro_monthly"                       │
│    └─ userId: <uuid>                                     │
│    ↓                                                      │
│ 3. Edge Function cria Checkout Session no Stripe         │
│    ├─ customer_email: user.email                         │
│    ├─ metadata: { userId }                               │
│    └─ success_url, cancel_url                            │
│    ↓                                                      │
│ 4. Retorna checkout_url                                  │
│    ↓                                                      │
│ 5. Frontend redireciona para Stripe                      │
│    ↓                                                      │
│ 6. Usuário preenche dados e paga                         │
│    ↓                                                      │
│ 7. Stripe envia webhook: checkout.session.completed      │
│    ↓                                                      │
│ 8. stripe-webhook valida assinatura                      │
│    ↓                                                      │
│ 9. Atualiza banco de dados                               │
│    ├─ subscription_tier: "pro"                           │
│    ├─ subscription_status: "active"                      │
│    └─ credits_remaining: 999999 (ilimitado)              │
│    ↓                                                      │
│ 10. Stripe redireciona para success_url                  │
│     └─ /success?session_id=<id>                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Performance

### Otimizações Implementadas

#### Frontend
- **Code Splitting**: Vite faz automaticamente
- **Tree Shaking**: Remove código não utilizado
- **Minificação**: Build de produção minificado
- **Lazy Loading**: Imagens carregadas sob demanda

#### Backend
- **Edge Functions**: Executam próximas ao usuário
- **Connection Pooling**: Supabase gerencia automaticamente
- **Índices**: Criados em colunas frequentemente consultadas
- **Caching**: Headers de cache configurados

#### Banco de Dados
```sql
-- Índices para performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_plan ON profiles(plan);
CREATE INDEX idx_history_user_created ON formatting_history(user_id, created_at DESC);
```

### Métricas Alvo

| Métrica | Alvo | Atual |
|---------|------|-------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3s | ~2.5s |
| Lighthouse Score | > 90 | 88 |
| Bundle Size (gzipped) | < 200KB | ~180KB |

---

## 🔄 Escalabilidade

### Escalabilidade Horizontal

**Frontend (Vercel)**:
- Deploy em CDN global
- Auto-scaling automático
- Edge caching

**Backend (Supabase)**:
- Edge Functions escalam automaticamente
- PostgreSQL escala verticalmente
- Connection pooling gerenciado

### Limitações Conhecidas

1. **PostgreSQL**: Escala verticalmente (limite ~100k usuários ativos)
2. **OpenAI API**: Rate limits (500 req/min)
3. **Stripe**: Sem limites práticos

### Estratégias para Escala

**Quando atingir 10k usuários**:
- Implementar cache Redis
- Otimizar queries com materialized views
- Implementar queue para formatações (Bull/BullMQ)

**Quando atingir 100k usuários**:
- Considerar sharding do banco
- Migrar para Supabase Enterprise
- Implementar CDN para assets

---

## 🧪 Testabilidade

### Estratégia de Testes (Planejada)

#### Testes Unitários (Jest + RTL)
```typescript
// Button.test.tsx
describe('Button', () => {
  it('renders with primary variant', () => {
    render(<Button variant="primary">Click</Button>);
    expect(screen.getByText('Click')).toBeInTheDocument();
  });
});
```

#### Testes de Integração
```typescript
// FormatterInterface.test.tsx
it('formats text successfully', async () => {
  render(<FormatterInterface />);
  
  const input = screen.getByPlaceholderText('Digite seu texto...');
  fireEvent.change(input, { target: { value: 'Teste de formatação' } });
  
  const button = screen.getByText('Formatar');
  fireEvent.click(button);
  
  await waitFor(() => {
    expect(screen.getByText(/formatado/i)).toBeInTheDocument();
  });
});
```

#### Testes E2E (Playwright)
```typescript
// auth.spec.ts
test('user can sign up and login', async ({ page }) => {
  await page.goto('/auth');
  await page.fill('[name=email]', 'test@example.com');
  await page.fill('[name=password]', 'password123');
  await page.click('button:has-text("Criar Conta")');
  
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 📚 Decisões de Arquitetura

### Por que Supabase?
- ✅ Backend completo (DB + Auth + Functions)
- ✅ PostgreSQL (SQL familiar)
- ✅ Row Level Security nativo
- ✅ Custo baixo para MVP
- ❌ Vendor lock-in moderado

### Por que Wouter em vez de React Router?
- ✅ Bundle 10x menor (1.3KB vs 13KB)
- ✅ API mais simples
- ✅ Suficiente para SPA
- ❌ Menos features (sem nested routes complexos)

### Por que Context API em vez de Redux?
- ✅ Nativo do React
- ✅ Menos boilerplate
- ✅ Suficiente para escopo atual
- ❌ Pode ser limitante em apps muito grandes

### Por que TailwindCSS?
- ✅ Desenvolvimento rápido
- ✅ Consistência visual
- ✅ Tree-shaking automático
- ✅ Dark mode nativo
- ❌ Classes verbosas

---

## 🔮 Evolução Futura

### Melhorias Planejadas

**Curto Prazo (1-3 meses)**:
- Implementar testes automatizados
- Adicionar monitoring (Sentry)
- Implementar CI/CD
- Adicionar React Query para cache

**Médio Prazo (3-6 meses)**:
- Migrar para Next.js (SSR/SSG)
- Implementar API pública
- Adicionar WebSockets para real-time
- Implementar PWA

**Longo Prazo (6-12 meses)**:
- App mobile (React Native)
- Extensão Chrome
- Integração com Telegram
- Multi-tenancy para empresas

---

## 📖 Referências

- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

---

**Última atualização**: Janeiro 2026
