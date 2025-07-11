import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface KPIData {
  income: number;
  expenses: number;
  balance: number;
  savings_rate: number;
  daily_limit: number;
  projected_balance: number;
  date_range: {
    start: string;
    end: string;
  };
}

interface UseKPIsOptions {
  period: 'current' | 'next' | '3months' | 'custom';
  customStart?: string;
  customEnd?: string;
}

export function useKPIsRefactored(options: UseKPIsOptions) {
  const { period, customStart, customEnd } = options;
  
  const params = new URLSearchParams({
    period,
    ...(customStart && { customStart }),
    ...(customEnd && { customEnd }),
  });

  const { data, loading, error, refetch } = useApi<KPIData>(`/api/kpis?${params}`);

  // Formatar KPIs para o formato esperado pelo frontend
  const kpis = data ? [
    {
      key: 'income',
      title: 'Receitas',
      value: data.income,
      color: 'green' as const,
      icon: 'TrendingUp',
      subtitle: 'Receitas do período',
      count: 0
    },
    {
      key: 'expenses',
      title: 'Despesas',
      value: data.expenses,
      color: 'red' as const,
      icon: 'TrendingDown',
      subtitle: 'Despesas do período',
      count: 0
    },
    {
      key: 'balance',
      title: 'Saldo',
      value: data.balance,
      color: 'blue' as const,
      icon: 'Wallet',
      subtitle: 'Saldo atual',
      count: 0
    },
    {
      key: 'savings_rate',
      title: 'Taxa de Poupança',
      value: data.savings_rate,
      color: 'lime' as const,
      icon: 'PiggyBank',
      subtitle: `${data.savings_rate}% do total`,
      count: 0
    },
    {
      key: 'daily_limit',
      title: 'Limite Diário',
      value: data.daily_limit,
      color: 'orange' as const,
      icon: 'Calendar',
      subtitle: 'Disponível por dia',
      count: 0
    }
  ] : [];

  return {
    kpis,
    loading,
    error,
    refetch,
    dateRange: data?.date_range ? {
      start: new Date(data.date_range.start),
      end: new Date(data.date_range.end)
    } : null
  };
} 