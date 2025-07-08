# Julius - Assistente Financeiro Pessoal

O Julius é um assistente financeiro pessoal desenvolvido em Next.js com Supabase, focado em proporcionar uma experiência de onboarding guiado, controle de receitas, despesas, contas bancárias e projeções financeiras.

## 🚀 Características Principais

- **Onboarding Obrigatório**: Fluxo guiado em 4 etapas (perfil, receitas, despesas, contas)
- **Controle Financeiro**: Gestão de entradas, saídas e contas bancárias
- **Projeções**: Cálculo de saldo projetado baseado em transações futuras
- **Notificações WhatsApp**: Configuração de alertas e resumos
- **UX Otimizada**: Skeleton loaders, feedback visual e navegação intuitiva
- **Responsivo**: Interface adaptada para mobile e desktop

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: TailwindCSS, shadcn/ui
- **Estado**: React Context + Custom Hooks
- **Notificações**: Sonner (toasts)
- **Ícones**: Lucide React

## 📁 Estrutura do Projeto

```
bolt-julius/
├── app/                    # Páginas Next.js (App Router)
│   ├── ajustes/           # Configurações do usuário
│   ├── auth/              # Autenticação
│   ├── home/              # Dashboard principal
│   ├── login/             # Página de login
│   ├── onboarding/        # Fluxo de onboarding
│   └── signup/            # Cadastro de usuário
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── navigation/       # Componentes de navegação
│   └── providers/        # Providers de contexto
├── contexts/             # Contextos React
│   └── UserContext.tsx   # Contexto global do usuário
├── hooks/                # Hooks customizados
│   ├── useUserProfile.ts # Hook para perfil do usuário
│   ├── useBankAccounts.ts # Hook para contas bancárias
│   └── useTransactions.ts # Hook para transações
├── lib/                  # Utilitários e configurações
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Funções utilitárias
│   ├── supabaseClient.ts # Cliente Supabase
│   └── bankAccounts.ts   # Funções de contas bancárias
└── middleware.ts         # Middleware de autenticação
```

## 🔧 Configuração e Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

### 1. Clone o repositório

```bash
git clone <repository-url>
cd bolt-julius
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 4. Configure o banco de dados

Execute o script SQL fornecido no arquivo `supabase_migrations.sql` no seu projeto Supabase.

### 5. Execute o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

- **profiles**: Perfis dos usuários
- **transactions**: Transações (receitas e despesas)
- **bank_accounts**: Contas bancárias
- **recurrence_exceptions**: Exceções de transações recorrentes

### Relacionamentos

- `profiles.user_id` → `auth.users.id`
- `transactions.user_id` → `auth.users.id`
- `bank_accounts.user_id` → `auth.users.id`
- `recurrence_exceptions.transaction_id` → `transactions.id`

## 🎯 Fluxo de Onboarding

1. **Perfil**: Nome e WhatsApp do usuário
2. **Receitas**: Cadastro de receitas recorrentes
3. **Despesas**: Cadastro de despesas fixas, variáveis e assinaturas
4. **Contas**: Configuração de contas bancárias com saldos

## 🔄 Hooks Customizados

### useUserProfile
Gerencia o perfil do usuário com operações CRUD.

```typescript
const { profile, loading, error, updateProfile } = useUserProfile();
```

### useBankAccounts
Gerencia contas bancárias com operações CRUD.

```typescript
const { accounts, loading, error, addAccount, updateAccount, deleteAccount } = useBankAccounts();
```

### useTransactions
Gerencia transações com operações CRUD.

```typescript
const { transactions, loading, error, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
```

## 🎨 Componentes Reutilizáveis

### LoadingSkeleton
Skeletons específicos para diferentes tipos de conteúdo:

```typescript
<LoadingSkeleton type="kpis" />
<LoadingSkeleton type="accounts" />
<LoadingSkeleton type="timeline" />
```

### TransactionForm
Formulário reutilizável para cadastro de transações:

```typescript
<TransactionForm 
  type="income" 
  transactions={incomes} 
  onTransactionsChange={setIncomes} 
/>
```

## 📱 Responsividade

O projeto é totalmente responsivo com breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🔒 Autenticação e Segurança

- Autenticação via Supabase Auth
- Middleware para proteção de rotas
- Row Level Security (RLS) no banco de dados
- Validação de dados no frontend e backend

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras Plataformas

O projeto pode ser deployado em qualquer plataforma que suporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do email.

---

**Desenvolvido com ❤️ para facilitar o controle financeiro pessoal** 