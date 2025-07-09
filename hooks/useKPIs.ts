import { useMemo } from 'react';
import { Transaction, BankAccount } from '@/lib/types/finance';
import { addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export interface KPIData {
  key: string;
  title: string;
  value: number;
  icon: string;
  color: 'lime' | 'red' | 'blue' | 'orange' | 'purple';
  subtitle: string;
  count: number;
}

export interface UseKPIsProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  period: 'current' | 'next' | '3months' | 'custom';
  customStart?: string;
  customEnd?: string;
  loading: boolean;
}

export function useKPIs({ 
  transactions, 
  bankAccounts, 
  period, 
  customStart, 
  customEnd, 
  loading 
}: UseKPIsProps) {
  const today = new Date();

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    let rangeStart: Date, rangeEnd: Date;
    
    if (period === "current") {
      rangeStart = startOfMonth(today);
      rangeEnd = endOfMonth(today);
    } else if (period === "next") {
      const next = addMonths(today, 1);
      rangeStart = startOfMonth(next);
      rangeEnd = endOfMonth(next);
    } else if (period === "3months") {
      rangeStart = startOfMonth(today);
      rangeEnd = endOfMonth(addMonths(today, 2));
    } else {
      rangeStart = parseISO(customStart || today.toISOString().split("T")[0]);
      rangeEnd = parseISO(customEnd || today.toISOString().split("T")[0]);
    }
    
    return { start: rangeStart, end: rangeEnd };
  }, [period, customStart, customEnd]);

  // Filter transactions for the current period
  const periodTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      if (transaction.is_recurring) {
        // For recurring transactions, check if they fall within the period
        if (transaction.day) {
          const transactionDate = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), transaction.day);
          return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
        }
        return false;
      } else {
        // For one-time transactions, check the specific date
        if (transaction.date) {
          const transactionDate = parseISO(transaction.date);
          return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
        }
        return false;
      }
    });
  }, [transactions, dateRange]);

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthPerformance = totalIncome - totalExpense;
    
    const fixedExpenses = expenseTransactions.filter(t => t.expense_type === 'fixed');
    const variableExpenses = expenseTransactions.filter(t => t.expense_type === 'variable');
    const subscriptionExpenses = expenseTransactions.filter(t => t.expense_type === 'subscription');
    
    const totalFixedExpense = fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalVariableExpense = variableExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalSubscriptionExpense = subscriptionExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    const totalAccountBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    // Calculate projected balance (simplified - can be enhanced)
    const projectedBalance = totalAccountBalance + totalIncome - totalExpense;
    const projectionDate = dateRange.end;

    return [
      {
        key: 'income',
        title: 'Entradas',
        value: totalIncome,
        icon: 'TrendingUp',
        color: 'lime',
        subtitle: incomeTransactions.length === 0 ? 'Nenhuma entrada no período' : `${incomeTransactions.length} entrada(s) no período`,
        count: incomeTransactions.length
      },
      {
        key: 'expense',
        title: 'Saídas',
        value: totalExpense,
        icon: 'TrendingDown',
        color: 'red',
        subtitle: expenseTransactions.length === 0 ? 'Nenhuma saída no período' : `${expenseTransactions.length} saída(s) no período`,
        count: expenseTransactions.length
      },
      {
        key: 'fixed',
        title: 'Fixas',
        value: totalFixedExpense,
        icon: 'AlertCircle',
        color: 'orange',
        subtitle: fixedExpenses.length === 0 ? 'Nenhuma despesa fixa no período' : `${fixedExpenses.length} despesa(s) fixa(s) no período`,
        count: fixedExpenses.length
      },
      {
        key: 'variable',
        title: 'Variáveis',
        value: totalVariableExpense,
        icon: 'AlertCircle',
        color: 'purple',
        subtitle: variableExpenses.length === 0 ? 'Nenhuma despesa variável no período' : `${variableExpenses.length} despesa(s) variável(is) no período`,
        count: variableExpenses.length
      },
      {
        key: 'subscription',
        title: 'Assinaturas',
        value: totalSubscriptionExpense,
        icon: 'CreditCard',
        color: 'blue',
        subtitle: subscriptionExpenses.length === 0 ? 'Nenhuma assinatura no período' : `${subscriptionExpenses.length} assinatura(s) no período`,
        count: subscriptionExpenses.length
      },
      {
        key: 'performance',
        title: 'Performance do Mês',
        value: monthPerformance,
        icon: 'TrendingUp',
        color: monthPerformance > 0 ? 'lime' : monthPerformance < 0 ? 'red' : 'blue',
        subtitle: monthPerformance > 0 ? 'Saldo positivo no período' : monthPerformance < 0 ? 'Saldo negativo no período' : 'Equilíbrio no período',
        count: 0
      },
      {
        key: 'balance',
        title: 'Saldo das Contas',
        value: totalAccountBalance,
        icon: 'Building2',
        color: 'blue',
        subtitle: bankAccounts.length === 0 ? 'Nenhuma conta configurada' : `${bankAccounts.length} conta(s) configurada(s)`,
        count: bankAccounts.length
      }
    ];
  }, [periodTransactions, bankAccounts, dateRange]);

  return {
    kpis,
    periodTransactions,
    dateRange,
    loading
  };
} 