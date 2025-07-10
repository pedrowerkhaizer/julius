import { useMemo } from 'react';
import { Transaction, BankAccount, CreditCardInvoice } from '@/lib/types/finance';
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
  invoices?: CreditCardInvoice[]; // NOVO
  timelineEvents?: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    expenseType?: 'fixed' | 'variable' | 'subscription';
    dateObj: Date;
    dateStr: string;
    isRecurring: boolean;
    transactionIdOriginal: string;
    subscriptionCard?: string;
    subscriptionBillingDay?: number;
    subscriptionCardDueDay?: number;
  }>;
}

export function useKPIs({ 
  transactions, 
  bankAccounts, 
  period, 
  customStart, 
  customEnd, 
  loading,
  invoices = [],
  timelineEvents // NOVO
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

  // NOVO: Se timelineEvents for fornecido, filtrar eventos do período a partir dela
  const periodTransactions = useMemo(() => {
    if (timelineEvents) {
      return timelineEvents.filter(event =>
        isWithinInterval(event.dateObj, { start: dateRange.start, end: dateRange.end })
      ).map(event => ({
        type: event.type,
        expense_type: event.expenseType,
        amount: event.amount
      }));
    }
    // fallback: lógica antiga
    return transactions.filter(transaction => {
      if (transaction.is_recurring) {
        if (transaction.day) {
          const transactionDate = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), transaction.day);
          return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
        }
        return false;
      } else {
        if (transaction.date) {
          const transactionDate = parseISO(transaction.date);
          return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
        }
        return false;
      }
    });
  }, [transactions, dateRange, timelineEvents]);

  // NOVO: Somar faturas de cartão de crédito do período como saída
  const invoicesExpense = useMemo(() => {
    let total = 0;
    invoices.forEach(invoice => {
      // Descobrir o dia de vencimento não é possível aqui, mas para KPI basta considerar o mês
      // Se a fatura é do mês do período, soma
      const [year, month] = invoice.month.split('-').map(Number);
      const invoiceDate = new Date(year, month - 1, 1);
      if (invoiceDate >= startOfMonth(dateRange.start) && invoiceDate <= endOfMonth(dateRange.end)) {
        total += invoice.value;
      }
    });
    return total;
  }, [invoices, dateRange]);

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0); // NÃO soma as faturas
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
        subtitle: expenseTransactions.length === 0 && invoicesExpense === 0 ? 'Nenhuma saída no período' : `${expenseTransactions.length + (invoicesExpense > 0 ? 1 : 0)} saída(s) no período`,
        count: expenseTransactions.length + (invoicesExpense > 0 ? 1 : 0)
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
  }, [periodTransactions, bankAccounts, dateRange, invoicesExpense]);

  return {
    kpis,
    periodTransactions,
    dateRange,
    loading
  };
} 