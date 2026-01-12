# Guia de Contribuição - ZapStyle

Obrigado por considerar contribuir com o ZapStyle! Este documento fornece diretrizes e melhores práticas para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Padrões de Código](#padrões-de-código)
- [Convenções de Commit](#convenções-de-commit)
- [Processo de Pull Request](#processo-de-pull-request)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Features](#sugerindo-features)

---

## 📜 Código de Conduta

Este projeto adota um Código de Conduta que esperamos que todos os participantes sigam. Por favor, leia o [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) para entender quais comportamentos são aceitáveis.

**Resumo**:
- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

---

## 🤝 Como Contribuir

Existem várias formas de contribuir com o ZapStyle:

### 1. Reportar Bugs
Encontrou um bug? [Abra uma issue](https://github.com/rocketsolucoes/format-wpp-mvp/issues/new?template=bug_report.md) com detalhes.

### 2. Sugerir Features
Tem uma ideia? [Abra uma issue](https://github.com/rocketsolucoes/format-wpp-mvp/issues/new?template=feature_request.md) descrevendo a feature.

### 3. Melhorar Documentação
Documentação sempre pode ser melhorada! PRs para docs são muito bem-vindos.

### 4. Contribuir com Código
Veja as [issues abertas](https://github.com/rocketsolucoes/format-wpp-mvp/issues) e escolha uma para trabalhar.

### 5. Revisar Pull Requests
Ajude revisando PRs abertos e dando feedback construtivo.

---

## ⚙️ Configuração do Ambiente

### Pré-requisitos

Certifique-se de ter instalado:
- **Node.js** 18+ (recomendado 22.13.0)
- **pnpm** 10+
- **Git**
- **Supabase CLI** (opcional, mas recomendado)

### Setup Passo a Passo

#### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Depois clone seu fork
git clone https://github.com/SEU-USUARIO/format-wpp-mvp.git
cd format-wpp-mvp

# Adicione o repositório original como upstream
git remote add upstream https://github.com/rocketsolucoes/format-wpp-mvp.git
```

#### 2. Instale Dependências

```bash
pnpm install
```

#### 3. Configure Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

Edite `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Obtendo Credenciais de Desenvolvimento**:
- **Supabase**: Use o projeto de desenvolvimento compartilhado ou crie o seu
- **Stripe**: Use chaves de teste (começam com `pk_test_` e `sk_test_`)
- **OpenAI**: Solicite acesso à chave de desenvolvimento

#### 4. Configure o Banco de Dados Local (Opcional)

Se quiser rodar Supabase localmente:

```bash
# Instale o Supabase CLI
npm install -g supabase

# Inicie Supabase local
supabase start

# Execute migrations
supabase db push
```

#### 5. Inicie o Servidor de Desenvolvimento

```bash
pnpm dev
```

Acesse: [http://localhost:5173](http://localhost:5173)

### Verificando a Instalação

Execute os seguintes comandos para verificar se tudo está funcionando:

```bash
# Verificar tipos TypeScript
pnpm typecheck

# Verificar lint
pnpm lint

# Build de produção
pnpm build
```

Se todos os comandos executarem sem erros, você está pronto para contribuir! 🎉

---

## 📝 Padrões de Código

### TypeScript

#### ✅ Sempre use TypeScript
```typescript
// ✅ Bom
interface User {
  id: string;
  name: string;
}

const getUser = (id: string): User => {
  // ...
};

// ❌ Evite
const getUser = (id) => {
  // ...
};
```

#### ✅ Evite `any`
```typescript
// ✅ Bom
interface ApiResponse {
  data: User[];
  error: string | null;
}

// ❌ Evite
const response: any = await fetch(...);
```

#### ✅ Use Union Types
```typescript
// ✅ Bom
type Plan = 'free' | 'pro' | 'enterprise';

// ❌ Evite
const plan: string = 'free';
```

### React

#### ✅ Componentes Funcionais
```typescript
// ✅ Bom
const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
  return <button onClick={onClick}>{children}</button>;
};

// ❌ Evite class components
class Button extends React.Component {
  // ...
}
```

#### ✅ Props com Interface
```typescript
// ✅ Bom
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = (props) => {
  // ...
};
```

#### ✅ Hooks no Topo
```typescript
// ✅ Bom
const Component = () => {
  const [state, setState] = useState('');
  const { user } = useAuth();
  
  if (!user) return null;
  
  return <div>{state}</div>;
};

// ❌ Evite hooks condicionais
const Component = () => {
  if (condition) {
    const [state, setState] = useState(''); // ❌
  }
};
```

### Nomenclatura

#### Componentes
```typescript
// ✅ PascalCase para componentes
const UserProfile = () => { /* ... */ };
const DashboardStats = () => { /* ... */ };

// ❌ Evite
const userProfile = () => { /* ... */ };
const dashboard_stats = () => { /* ... */ };
```

#### Funções e Variáveis
```typescript
// ✅ camelCase para funções e variáveis
const getUserData = () => { /* ... */ };
const isLoading = true;

// ❌ Evite
const GetUserData = () => { /* ... */ };
const is_loading = true;
```

#### Constantes
```typescript
// ✅ UPPER_SNAKE_CASE para constantes
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// ❌ Evite
const maxRetryAttempts = 3;
```

#### Arquivos
```
✅ Bom:
- UserProfile.tsx (componentes)
- useAuth.ts (hooks)
- formatter.ts (services)
- Button.tsx (componentes UI)

❌ Evite:
- userProfile.tsx
- user-profile.tsx
- UserProfile.js (use .tsx para componentes)
```

### Estilização (TailwindCSS)

#### ✅ Use Classes Utilitárias
```tsx
// ✅ Bom
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
  Clique
</button>

// ❌ Evite CSS inline
<button style={{ padding: '8px 16px', background: 'blue' }}>
  Clique
</button>
```

#### ✅ Extraia Classes Repetidas
```tsx
// ✅ Bom - crie um componente
const PrimaryButton = ({ children }) => (
  <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
    {children}
  </button>
);

// ❌ Evite repetir classes
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">A</button>
<button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">B</button>
```

### Organização de Imports

```typescript
// 1. Imports de bibliotecas externas
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// 2. Imports de contextos e hooks
import { useAuth } from '../hooks/useAuth';
import { ThemeContext } from '../contexts/ThemeContext';

// 3. Imports de componentes
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

// 4. Imports de services e utils
import { formatText } from '../services/formatter';
import { supabase } from '../lib/supabase';

// 5. Imports de tipos
import type { User, FormatterResponse } from '../types';
```

### Comentários

#### ✅ Comente o "Por quê", não o "O quê"
```typescript
// ✅ Bom
// Validamos antes de enviar para evitar consumir créditos desnecessariamente
if (text.length < 10) {
  return;
}

// ❌ Evite comentários óbvios
// Verifica se o texto tem menos de 10 caracteres
if (text.length < 10) {
  return;
}
```

#### ✅ Use JSDoc para Funções Complexas
```typescript
/**
 * Formata texto usando IA da OpenAI
 * 
 * @param text - Texto a ser formatado (10-5000 caracteres)
 * @param styleId - ID do estilo de formatação (opcional)
 * @returns Texto formatado e créditos restantes
 * @throws {FormatterError} Se usuário não tiver créditos ou texto inválido
 */
export async function formatText(
  text: string,
  styleId?: string
): Promise<FormatTextResponse> {
  // ...
}
```

---

## 🔄 Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Formatação, ponto e vírgula, etc (não afeta código)
- **refactor**: Refatoração de código
- **perf**: Melhoria de performance
- **test**: Adição ou correção de testes
- **chore**: Tarefas de build, configs, etc

### Exemplos

```bash
# Feature
git commit -m "feat(formatter): adiciona suporte a múltiplos estilos"

# Fix
git commit -m "fix(auth): corrige erro ao fazer logout"

# Docs
git commit -m "docs(readme): atualiza instruções de instalação"

# Refactor
git commit -m "refactor(components): extrai lógica de validação para hook"

# Chore
git commit -m "chore(deps): atualiza dependências do projeto"
```

### Corpo do Commit (Opcional)

Para commits complexos, adicione um corpo explicativo:

```bash
git commit -m "feat(dashboard): adiciona gráfico de uso diário

Implementa visualização de uso diário usando Recharts.
Inclui filtros por período (7, 30, 90 dias).
Adiciona tooltip com detalhes ao passar o mouse.

Closes #123"
```

---

## 🔀 Processo de Pull Request

### Antes de Abrir um PR

1. **Sincronize com upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Crie uma branch descritiva**
   ```bash
   git checkout -b feat/adiciona-exportacao-pdf
   ```

3. **Faça commits atômicos**
   - Cada commit deve ser uma unidade lógica
   - Commits devem passar nos testes

4. **Execute os checks**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

### Abrindo o PR

1. **Push para seu fork**
   ```bash
   git push origin feat/adiciona-exportacao-pdf
   ```

2. **Abra o PR no GitHub**
   - Use um título descritivo
   - Preencha o template de PR
   - Referencie issues relacionadas

### Template de PR

```markdown
## Descrição
Breve descrição do que foi implementado/corrigido.

## Tipo de Mudança
- [ ] Bug fix (correção que não quebra funcionalidade existente)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (correção ou feature que quebra funcionalidade existente)
- [ ] Documentação

## Como Testar
1. Vá para '...'
2. Clique em '...'
3. Veja que '...'

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Revisei meu próprio código
- [ ] Comentei código complexo
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes (se aplicável)
- [ ] Todos os testes passam localmente

## Screenshots (se aplicável)
[Cole screenshots aqui]

## Issues Relacionadas
Closes #123
```

### Revisão de Código

**O que esperamos dos revisores**:
- Feedback construtivo e respeitoso
- Sugestões de melhoria
- Aprovação quando o código atende aos padrões

**O que esperamos dos autores**:
- Responder a todos os comentários
- Fazer mudanças solicitadas
- Agradecer o feedback

### Merge

Após aprovação:
1. Squash commits se necessário
2. Atualize a branch com main
3. Maintainer fará o merge

---

## 🐛 Reportando Bugs

### Antes de Reportar

1. **Verifique se já foi reportado**
   - Busque nas [issues existentes](https://github.com/rocketsolucoes/format-wpp-mvp/issues)

2. **Tente reproduzir**
   - Confirme que o bug é consistente
   - Teste em diferentes navegadores (se aplicável)

3. **Colete informações**
   - Versão do navegador
   - Sistema operacional
   - Passos para reproduzir

### Template de Bug Report

```markdown
## Descrição do Bug
Descrição clara e concisa do bug.

## Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Screenshots
Se aplicável, adicione screenshots.

## Ambiente
- OS: [ex: Windows 10]
- Navegador: [ex: Chrome 120]
- Versão: [ex: 1.2.3]

## Informações Adicionais
Qualquer outra informação relevante.

## Logs
```
[Cole logs do console aqui]
```
```

---

## 💡 Sugerindo Features

### Antes de Sugerir

1. **Verifique o roadmap**
   - Veja se já está planejado

2. **Busque por sugestões similares**
   - Evite duplicatas

3. **Considere o escopo**
   - A feature faz sentido para o projeto?

### Template de Feature Request

```markdown
## Problema
Qual problema esta feature resolve?

## Solução Proposta
Descrição clara da solução.

## Alternativas Consideradas
Outras soluções que você considerou.

## Informações Adicionais
Contexto adicional, screenshots, etc.

## Impacto
- [ ] Usuários finais
- [ ] Desenvolvedores
- [ ] Performance
- [ ] Segurança
```

---

## 🧪 Testes

### Executando Testes

```bash
# Testes unitários
pnpm test

# Testes E2E
pnpm test:e2e

# Coverage
pnpm test:coverage
```

### Escrevendo Testes

#### Testes de Componentes
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

#### Testes de Hooks
```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('signs in user', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
  });
});
```

---

## 📚 Recursos Úteis

### Documentação
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)

### Ferramentas
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [TypeScript Playground](https://www.typescriptlang.org/play)
- [Tailwind Play](https://play.tailwindcss.com)

### Comunidade
- [Discord](https://discord.gg/...) *(se houver)*
- [GitHub Discussions](https://github.com/rocketsolucoes/format-wpp-mvp/discussions)

---

## ❓ Dúvidas?

Se tiver dúvidas sobre como contribuir:

1. Abra uma [Discussion](https://github.com/rocketsolucoes/format-wpp-mvp/discussions)
2. Entre em contato via email: dev@zapstyle.com
3. Pergunte no Discord (se disponível)

---

**Obrigado por contribuir com o ZapStyle! 🎉**
