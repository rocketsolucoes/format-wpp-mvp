# ZapStyle 💬✨

> Formatador de mensagens WhatsApp com IA - Estilize suas mensagens de forma profissional.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.57-3ecf8e?logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📖 Sobre o Projeto

ZapStyle é uma aplicação web que utiliza Inteligência Artificial para formatar mensagens de texto para WhatsApp de forma profissional e estratégica. A IA aplica negrito, itálico e listas automaticamente, aumentando a clareza e o impacto das suas mensagens.

**Principais Funcionalidades:**
- 🤖 Formatação automática com IA (OpenAI)
- 📱 Preview em tempo real no estilo WhatsApp
- 🎨 Múltiplos estilos de formatação
- 📊 Dashboard com estatísticas e histórico
- 💳 Sistema de créditos e assinaturas (Stripe)
- 🌓 Tema claro e escuro
- 📈 Analytics e métricas de uso

## 🚀 Demo

**Acesse**: [zapstyle.com](https://zapstyle.com) *(substitua pela URL real)*

**Preview Gratuito**: Teste a formatação sem cadastro (limitado a 500 caracteres)

## 🛠️ Stack Tecnológica

### Frontend
- **React 18.3** - Biblioteca UI com hooks
- **TypeScript 5.5** - Tipagem estática
- **Vite 5.4** - Build tool moderna
- **TailwindCSS 3.4** - Framework CSS utility-first
- **Wouter 3.7** - Roteador minimalista
- **Lucide React** - Ícones SVG
- **Recharts** - Gráficos e visualizações

### Backend & Infraestrutura
- **Supabase** - Backend as a Service
  - PostgreSQL (banco de dados)
  - Auth (autenticação)
  - Edge Functions (serverless)
  - Row Level Security (RLS)
- **Stripe** - Pagamentos e assinaturas
- **OpenAI API** - Formatação com IA
- **Vercel** - Hospedagem e deploy

## 📋 Pré-requisitos

- **Node.js** 18+ (recomendado 22.13.0)
- **pnpm** 10+ (gerenciador de pacotes)
- **Git** para controle de versão
- Conta no **Supabase** (gratuita)
- Conta no **Stripe** (modo teste gratuito)
- Chave de API do **OpenAI**

## ⚙️ Instalação e Configuração

### 1. Clone o Repositório

```bash
git clone https://github.com/rocketsolucoes/format-wpp-mvp.git
cd format-wpp-mvp
```

### 2. Instale as Dependências

```bash
pnpm install
```

### 3. Configure as Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Stripe (opcional para desenvolvimento local)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# OpenAI (configurado nas Edge Functions)
OPENAI_API_KEY=sk-...
```

**Como obter as credenciais:**

- **Supabase**: Crie um projeto em [supabase.com](https://supabase.com) → Settings → API
- **Stripe**: Crie uma conta em [stripe.com](https://stripe.com) → Developers → API Keys
- **OpenAI**: Obtenha em [platform.openai.com](https://platform.openai.com/api-keys)

### 4. Configure o Banco de Dados

Execute as migrations do Supabase:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Faça login
supabase login

# Link com seu projeto
supabase link --project-ref seu-projeto-ref

# Execute as migrations
supabase db push
```

### 5. Configure as Edge Functions

```bash
# Deploy das Edge Functions
supabase functions deploy format-text
supabase functions deploy format-text-preview
supabase functions deploy create-checkout
supabase functions deploy create-portal-session
supabase functions deploy stripe-webhook

# Configure os secrets
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Inicie o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

## 📁 Estrutura do Projeto

```
format-wpp-mvp/
├── src/
│   ├── components/          # 59 componentes React
│   │   ├── ui/             # 24 componentes base (Design System)
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── FormatterInterface.tsx
│   │   └── ...
│   ├── pages/              # 11 páginas principais
│   │   ├── Home.tsx
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Format.tsx
│   │   ├── History.tsx
│   │   ├── Settings.tsx
│   │   └── admin/
│   ├── contexts/           # Context API
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/              # Custom hooks
│   │   └── useAuth.ts
│   ├── layouts/            # Layouts compartilhados
│   │   └── DashboardLayout.tsx
│   ├── lib/                # Configurações de libs
│   │   ├── supabase.ts
│   │   └── stripe.ts
│   ├── services/           # Lógica de negócio
│   │   ├── formatter.ts
│   │   └── checkout.ts
│   ├── utils/              # Funções utilitárias
│   │   └── textPersistence.ts
│   ├── constants/          # Constantes
│   │   └── pricing.ts
│   ├── App.tsx             # Componente raiz
│   ├── main.tsx            # Entry point
│   └── index.css           # Estilos globais
├── supabase/
│   ├── functions/          # Edge Functions (Deno)
│   │   ├── format-text/
│   │   ├── format-text-preview/
│   │   ├── create-checkout/
│   │   ├── create-portal-session/
│   │   └── stripe-webhook/
│   └── migrations/         # 17 migrations SQL
├── public/                 # Assets estáticos
├── docs/                   # Documentação adicional
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🏗️ Arquitetura

### Frontend (React SPA)
- **React 18** com functional components e hooks
- **TypeScript** para tipagem estática
- **Context API** para estado global (Auth, Theme)
- **Wouter** para roteamento client-side
- **TailwindCSS** para estilização

### Backend (Supabase)
- **PostgreSQL** com Row Level Security (RLS)
- **Auth** com email/senha e Google OAuth
- **Edge Functions** (Deno) para lógica server-side
- **Storage** para assets (futuro)

### Integrações
- **OpenAI API** - Formatação de texto com GPT
- **Stripe** - Pagamentos e assinaturas
- **Vercel** - Hospedagem e CDN

### Segurança
- Row Level Security (RLS) no banco
- Validação em múltiplas camadas
- Secrets via variáveis de ambiente
- Tokens JWT com auto-refresh
- CORS configurado nas Edge Functions

## 🗄️ Banco de Dados

### Tabelas Principais

**profiles** - Dados do usuário
- `id` (uuid, FK para auth.users)
- `email`, `full_name`, `avatar_url`
- `plan`, `subscription_tier`, `subscription_status`
- `credits_remaining`

**formatting_history** - Histórico de formatações
- `id`, `user_id`
- `input_text`, `output_text`
- `style_id`, `is_favorite`
- `tokens_used`, `created_at`

**formatting_prompts** - Estilos de formatação (admin)
- `id`, `name`, `description`
- `system_prompt`, `is_active`

### Funções PostgreSQL
- `get_user_stats()` - Estatísticas do usuário
- `get_daily_usage()` - Uso diário para gráficos

## 🔐 Autenticação

### Fluxos Suportados
- ✅ Registro com email/senha
- ✅ Login com email/senha
- ✅ Login com Google OAuth
- ✅ Reset de senha
- ✅ Persistência de sessão
- ✅ Auto-refresh de token

### Rotas Protegidas
- `/dashboard` - Painel do usuário
- `/format` - Interface de formatação
- `/history` - Histórico de formatações
- `/settings` - Configurações
- `/admin/*` - Área administrativa

## 💳 Sistema de Créditos

### Planos Disponíveis

| Plano | Créditos | Preço | Recursos |
|-------|----------|-------|----------|
| **Free** | 30/mês | Grátis | Estilos básicos |
| **Pro** | Ilimitado | R$ 29/mês | Todos os estilos + histórico |
| **Enterprise** | Ilimitado | R$ 99/mês | API + suporte prioritário |

### Como Funciona
1. Cada formatação consome 1 crédito
2. Créditos renovam mensalmente
3. Planos Pro/Enterprise têm créditos ilimitados
4. Preview gratuito (sem cadastro) não consome créditos

## 🧪 Testes

**Status Atual**: ⚠️ Sem testes implementados

**Planejado**:
```bash
# Testes unitários
pnpm test

# Testes E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

**TODO**: Implementar Jest + React Testing Library + Cypress/Playwright

## 📦 Build e Deploy

### Build de Produção

```bash
# Build
pnpm build

# Preview local
pnpm preview
```

### Deploy (Vercel)

```bash
# Instale o Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy para produção
vercel --prod
```

**Deploy Automático**: Configurado via GitHub Actions (futuro)

## 🔧 Scripts Disponíveis

```bash
pnpm dev          # Inicia servidor de desenvolvimento
pnpm build        # Build de produção
pnpm preview      # Preview do build
pnpm lint         # Lint do código
pnpm typecheck    # Verificação de tipos TypeScript
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas diretrizes:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

**Convenções de Código**:
- Use TypeScript para todo código novo
- Siga o padrão de componentes funcionais
- Adicione tipos para todas as funções
- Mantenha componentes pequenos e focados
- Adicione comentários em lógica complexa

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Rocket Soluções** - [GitHub](https://github.com/rocketsolucoes)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service
- [Stripe](https://stripe.com) - Processamento de pagamentos
- [OpenAI](https://openai.com) - API de IA
- [Vercel](https://vercel.com) - Hospedagem
- [Lucide](https://lucide.dev) - Ícones

## 📞 Suporte

- **Email**: suporte@zapstyle.com *(substitua pelo real)*
- **Discord**: [Comunidade ZapStyle](https://discord.gg/...) *(se houver)*
- **Issues**: [GitHub Issues](https://github.com/rocketsolucoes/format-wpp-mvp/issues)

## 🗺️ Roadmap

### ✅ Implementado
- [x] Formatação com IA
- [x] Sistema de créditos
- [x] Integração com Stripe
- [x] Dashboard com estatísticas
- [x] Histórico de formatações
- [x] Tema claro/escuro
- [x] Múltiplos estilos

### 🚧 Em Desenvolvimento
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoring (Sentry)
- [ ] Analytics (Posthog)

### 📋 Planejado
- [ ] API pública
- [ ] Extensão Chrome
- [ ] App mobile (React Native)
- [ ] Integração com Telegram
- [ ] Formatação em lote
- [ ] Templates salvos

---

**Feito com ❤️ por Rocket Soluções**
