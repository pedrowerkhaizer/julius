# Refatoração de Páginas com Mais de 500 Linhas - Julius

## Contexto do Projeto

### **Projeto: Julius - Assistente Financeiro Pessoal**

**Tecnologias:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Radix UI (shadcn/ui)
- Supabase (autenticação e banco de dados)
- React Hook Form + Zod (validação)

**Arquitetura Atual:**
- Páginas com mais de 500 linhas identificadas:
  - `app/home/page.tsx` (1.808 linhas) - Página principal com timeline de eventos
  - `app/ajustes/page.tsx` (714 linhas) - Configurações do usuário
  - `app/onboarding/page.tsx` (686 linhas) - Fluxo de onboarding

**Estrutura de Componentes Existente:**
```
components/
├── ui/                    # Componentes base do shadcn/ui
├── providers/            # ThemeProvider, UserProvider
├── navigation/           # Componentes de navegação
├── TransactionForm.tsx   # Formulário de transações (344 linhas)
└── WhatsAppInput.tsx     # Input para WhatsApp (107 linhas)
```

**Tipos e Utilitários:**
- `lib/types/finance.ts` - Tipos centralizados para domínio financeiro
- `lib/bankAccounts.ts` - Funções para gerenciar contas bancárias
- `lib/supabaseClient.ts` - Cliente Supabase e funções de perfil
- `lib/utils.ts` - Utilitários gerais

**Funcionalidades Principais:**
1. **Timeline de Eventos** (home): KPIs, transações recorrentes/únicas, projeções
2. **Configurações** (ajustes): Perfil, notificações WhatsApp, contas bancárias
3. **Onboarding** (onboarding): Setup inicial em 4 passos

---

## **PROMPT PARA REFATORAÇÃO**

---

**Objetivo:** Refatorar as páginas com mais de 500 linhas de código, extraindo componentes reutilizáveis e seguindo princípios de Clean Code e Component-Driven Development.

### **Diretrizes de Refatoração:**

#### **1. Estrutura de Componentes Proposta:**
```
components/
├── ui/                    # Manter componentes base
├── providers/            # Manter providers existentes
├── navigation/           # Manter navegação
├── forms/               # NOVO: Formulários específicos
│   ├── TransactionForm.tsx
│   ├── BankAccountForm.tsx
│   ├── ProfileForm.tsx
│   └── NotificationForm.tsx
├── dashboard/           # NOVO: Componentes do dashboard
│   ├── KPICard.tsx
│   ├── KPIGrid.tsx
│   ├── TimelineEvent.tsx
│   ├── TimelineHeader.tsx
│   └── AccountBalanceCard.tsx
├── onboarding/          # NOVO: Componentes do onboarding
│   ├── OnboardingStep.tsx
│   ├── OnboardingProgress.tsx
│   └── OnboardingValidation.tsx
├── settings/            # NOVO: Componentes de configurações
│   ├── NotificationCard.tsx
│   ├── BankAccountList.tsx
│   └── ProfileSection.tsx
├── dialogs/             # NOVO: Dialogs específicos
│   ├── TransactionDialog.tsx
│   ├── EditTransactionDialog.tsx
│   ├── DeleteTransactionDialog.tsx
│   └── KPIDetailsDialog.tsx
└── layout/              # NOVO: Componentes de layout
    ├── PageHeader.tsx
    ├── FloatingActionButtons.tsx
    └── UserMenu.tsx
```

#### **2. Princípios de Refatoração:**

**A) Separação de Responsabilidades:**
- Cada componente deve ter uma responsabilidade única
- Lógica de negócio em hooks customizados
- Estados locais apenas quando necessário
- Props bem definidas com TypeScript

**B) Reutilização:**
- Componentes genéricos para elementos repetitivos
- Props flexíveis para diferentes contextos
- Composição sobre herança

**C) Performance:**
- Memoização quando apropriado
- Lazy loading para componentes pesados
- Otimização de re-renders

#### **3. Hooks Customizados a Criar:**
```
hooks/
├── useTransactions.ts      # Gerenciar transações
├── useBankAccounts.ts      # Gerenciar contas bancárias
├── useUserProfile.ts       # Gerenciar perfil
├── useNotifications.ts     # Gerenciar notificações
├── useOnboarding.ts        # Gerenciar estado do onboarding
└── useKPIs.ts             # Calcular KPIs
```

#### **4. Padrões de Nomenclatura:**
- Componentes: PascalCase (`KPICard`, `TransactionForm`)
- Hooks: camelCase com prefixo `use` (`useTransactions`)
- Tipos: PascalCase com sufixo descritivo (`TransactionData`, `KPICardProps`)
- Props: camelCase (`onTransactionAdd`, `isLoading`)

#### **5. Estrutura de Props:**
```typescript
interface KPICardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'lime' | 'red' | 'blue' | 'orange' | 'purple';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
}
```

### **Tarefas Específicas:**

#### **1. Refatorar `app/home/page.tsx` (1.808 linhas):**
- Extrair `KPIGrid` com 8 cards de KPI
- Extrair `TimelineEvent` para cada evento
- Extrair `TimelineHeader` para cabeçalhos de data
- Extrair `FloatingActionButtons` para botões flutuantes
- Extrair `UserMenu` para menu do usuário
- Extrair `TransactionDialog` para adicionar transações
- Extrair `EditTransactionDialog` para edição
- Extrair `DeleteTransactionDialog` para remoção
- Extrair `KPIDetailsDialog` para detalhes dos KPIs
- Criar hook `useKPIs` para cálculos
- Criar hook `useTimeline` para lógica da timeline

#### **2. Refatorar `app/ajustes/page.tsx` (714 linhas):**
- Extrair `ProfileSection` para dados do perfil
- Extrair `NotificationCard` para cada tipo de notificação
- Extrair `BankAccountList` para lista de contas
- Extrair `BankAccountForm` para adicionar/editar contas
- Criar hook `useNotifications` para gerenciar notificações
- Criar hook `useSettings` para gerenciar configurações

#### **3. Refatorar `app/onboarding/page.tsx` (686 linhas):**
- Extrair `OnboardingStep` para cada passo
- Extrair `OnboardingProgress` para barra de progresso
- Extrair `OnboardingValidation` para validações
- Reutilizar `TransactionForm` existente
- Reutilizar `BankAccountForm` criado
- Criar hook `useOnboarding` para gerenciar estado

### **Critérios de Qualidade:**

1. **Cada componente deve ter no máximo 200 linhas**
2. **Props bem tipadas com TypeScript**
3. **Documentação JSDoc para componentes complexos**
4. **Testes de acessibilidade (aria-labels, roles)**
5. **Responsividade mantida**
6. **Performance otimizada**
7. **Código limpo e legível**

### **Exemplo de Refatoração:**

**Antes (em home/page.tsx):**
```tsx
// 200+ linhas de JSX inline
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
  <Card onClick={() => setOpenKpiDialog("income")} className="cursor-pointer hover:ring-2 hover:ring-lime-400 transition">
    {/* 50+ linhas de conteúdo */}
  </Card>
  {/* 7 cards similares... */}
</div>
```

**Depois:**
```tsx
// home/page.tsx
<KPIGrid 
  kpis={calculatedKPIs}
  onKPIClick={setOpenKpiDialog}
  loading={userLoading || eventsLoading}
/>

// components/dashboard/KPIGrid.tsx
export function KPIGrid({ kpis, onKPIClick, loading }: KPIGridProps) {
  if (loading) return <KPIGridSkeleton />;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {kpis.map(kpi => (
        <KPICard key={kpi.key} {...kpi} onClick={() => onKPIClick(kpi.key)} />
      ))}
    </div>
  );
}
```

### **Resultado Esperado:**
- Páginas principais com menos de 200 linhas
- Componentes reutilizáveis e bem testados
- Código mais legível e manutenível
- Performance melhorada
- Facilidade para adicionar novas funcionalidades

**Comece pela página `home/page.tsx` que é a mais complexa, depois `ajustes/page.tsx` e por último `onboarding/page.tsx`.**

---

## **ESTRUTURA DE TIPOS EXISTENTE**

### **Tipos Principais (`lib/types/finance.ts`):**

```typescript
// Tipos de domínio
export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  is_recurring: boolean;
  type: 'income' | 'expense';
  expense_type?: 'fixed' | 'variable' | 'subscription';
  day?: number;
  date?: string;
  recurrence_end_date?: string;
  subscription_card?: string;
  subscription_billing_day?: number;
  subscription_card_due_day?: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  whatsapp: string;
  avatar_url?: string;
  onboarding_completed: boolean;
  notificacoes?: {
    weekly_summary?: NotificationConfig;
    monthly_projection?: NotificationConfig;
    alerts?: NotificationConfig;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationConfig {
  enabled: boolean;
  day: string;
  hour: string;
}
```

### **Componentes UI Disponíveis:**

- `Card`, `CardHeader`, `CardContent`, `CardTitle`
- `Button` (com variantes)
- `Input`, `Label`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Avatar`, `AvatarImage`, `AvatarFallback`
- `Switch`
- `Skeleton`
- `Progress`
- `DropdownMenu` e derivados
- `Toast` (via sonner)

### **Utilitários Disponíveis:**

- `formatDateFriendly()` - Formatação de datas
- `formatTimelineDate()` - Formatação para timeline
- `getBankName()` - Nome do banco
- `getAccountTypeName()` - Nome do tipo de conta
- `validateAccountData()` - Validação de dados de conta
- `AVAILABLE_BANKS` - Lista de bancos disponíveis

---

## **ORDEM DE REFATORAÇÃO RECOMENDADA**

1. **Criar hooks customizados primeiro**
2. **Extrair componentes de layout (PageHeader, UserMenu, etc.)**
3. **Extrair componentes de dashboard (KPIGrid, KPICard, etc.)**
4. **Extrair dialogs específicos**
5. **Extrair componentes de formulários**
6. **Refatorar páginas principais**
7. **Testar e otimizar**

**Lembre-se: Mantenha a funcionalidade existente intacta durante a refatoração!** 