# Refatoração do Frontend - Integração com Backend API

## Visão Geral

Esta refatoração centraliza toda a lógica de negócio no backend, eliminando duplicação de código e melhorando a manutenibilidade do sistema.

## Estrutura da Refatoração

### 1. Hooks Refatorados

#### `useApi.ts` - Hook Base
```typescript
// Hook genérico para fazer chamadas HTTP autenticadas
const { data, loading, error, refetch, mutate } = useApi<T>(endpoint, options);
```

#### `useKPIsRefactored.ts` - KPIs via API
```typescript
// Substitui useKPIs.ts - consome /api/kpis do backend
const { kpis, loading, error, dateRange } = useKPIsRefactored({
  period: 'current',
  customStart: '2024-01-01',
  customEnd: '2024-01-31'
});
```

#### `useTransactionsRefactored.ts` - Transações via API
```typescript
// Substitui useTransactions.ts - consome /api/transactions do backend
const { 
  transactions, 
  loading, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} = useTransactionsRefactored();
```

#### `useBalanceRefactored.ts` - Saldo via API
```typescript
// Substitui cálculos locais - consome /api/balance do backend
const { 
  currentBalance, 
  projectedBalance, 
  details, 
  loading 
} = useBalanceRefactored(projectionDate);
```

#### `useSimulationRefactored.ts` - Simulações via API
```typescript
// Nova funcionalidade - consome /api/simulation do backend
const { simulationData, simulating, simulatePurchase } = useSimulationRefactored();
```

### 2. Configuração da API

#### `lib/apiConfig.ts`
```typescript
// Configuração centralizada da API
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    KPIS: '/api/kpis',
    BALANCE: '/api/balance',
    SIMULATION: '/api/simulation',
    TRANSACTIONS: '/api/transactions',
    AUTH: '/api/auth',
  }
};
```

## Como Migrar

### Passo 1: Configurar Variáveis de Ambiente

Adicione no `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Passo 2: Substituir Hooks

#### Antes (useKPIs.ts):
```typescript
const { kpis, loading } = useKPIs({
  transactions,
  bankAccounts,
  period,
  customStart,
  customEnd,
  loading: transactionsLoading
});
```

#### Depois (useKPIsRefactored.ts):
```typescript
const { kpis, loading, error } = useKPIsRefactored({
  period,
  customStart,
  customEnd
});
```

### Passo 3: Atualizar Componentes

#### Exemplo: Página Home
```typescript
// Antes
import { useKPIs } from "@/hooks/useKPIs";
import { useTransactions } from "@/hooks/useTransactions";

// Depois
import { useKPIsRefactored } from "@/hooks/useKPIsRefactored";
import { useTransactionsRefactored } from "@/hooks/useTransactionsRefactored";
```

## Benefícios da Refatoração

### 1. Centralização da Lógica
- Toda lógica de negócio fica no backend
- Frontend fica responsável apenas pela UI
- Eliminação de duplicação de código

### 2. Consistência
- Mesma lógica usada pelo frontend e WhatsApp
- Dados sempre atualizados
- Validações centralizadas

### 3. Manutenibilidade
- Mudanças na lógica em um só lugar
- Testes mais fáceis
- Debugging simplificado

### 4. Performance
- Cálculos pesados no backend
- Cache no servidor
- Menos processamento no cliente

## Endpoints Disponíveis

### GET /api/kpis
```typescript
// Parâmetros
{
  period: 'current' | 'next' | '3months' | 'custom',
  customStart?: string, // YYYY-MM-DD
  customEnd?: string    // YYYY-MM-DD
}

// Resposta
{
  income: number,
  expenses: number,
  balance: number,
  savings_rate: number,
  daily_limit: number,
  projected_balance: number,
  date_range: {
    start: string,
    end: string
  }
}
```

### GET /api/balance
```typescript
// Parâmetros
{
  projectionDate?: string // YYYY-MM-DD
}

// Resposta
{
  current_balance: number,
  projected_balance: number,
  projection_date: string,
  details: {
    initial_balance: number,
    income: number,
    fixed_expenses: number,
    variable_expenses: number,
    subscriptions: number,
    invoices: number
  }
}
```

### POST /api/simulation
```typescript
// Request
{
  amount: number,
  description: string,
  category?: string
}

// Resposta
{
  original_balance: number,
  new_balance: number,
  impact: number,
  is_affordable: boolean,
  recommendation: string
}
```

### GET /api/transactions
```typescript
// Resposta
{
  transactions: Transaction[],
  total_count: number
}
```

## Próximos Passos

1. **Migrar Timeline**: Criar endpoint `/api/timeline` no backend
2. **Migrar Contas Bancárias**: Criar endpoint `/api/bank-accounts` no backend
3. **Migrar Cartões de Crédito**: Criar endpoint `/api/credit-cards` no backend
4. **Testes**: Implementar testes para os novos hooks
5. **Documentação**: Completar documentação da API

## Exemplo de Uso Completo

```typescript
// app/home-refactored/page.tsx
import { useKPIsRefactored } from "@/hooks/useKPIsRefactored";
import { useTransactionsRefactored } from "@/hooks/useTransactionsRefactored";
import { useBalanceRefactored } from "@/hooks/useBalanceRefactored";

export default function HomePage() {
  const { kpis, loading: kpisLoading } = useKPIsRefactored({
    period: 'current'
  });

  const { 
    transactions, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction 
  } = useTransactionsRefactored();

  const { currentBalance, projectedBalance } = useBalanceRefactored();

  return (
    <div>
      <KPIGrid kpis={kpis} loading={kpisLoading} />
      {/* Resto dos componentes */}
    </div>
  );
}
```

## Troubleshooting

### Erro de CORS
- Verificar se o backend está configurado para aceitar requisições do frontend
- Verificar se `FRONTEND_URL` está configurado no backend

### Erro de Autenticação
- Verificar se o token JWT está sendo enviado corretamente
- Verificar se o usuário está logado no Supabase

### Erro de Conectividade
- Verificar se o backend está rodando na porta correta
- Verificar se `NEXT_PUBLIC_API_URL` está configurado corretamente 