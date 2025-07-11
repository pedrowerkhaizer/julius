import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface BalanceData {
  current_balance: number;
  projected_balance: number;
  projection_date: string;
  details: {
    initial_balance: number;
    income: number;
    fixed_expenses: number;
    variable_expenses: number;
    subscriptions: number;
    invoices: number;
  };
}

export function useBalanceRefactored(projectionDate?: string) {
  const params = new URLSearchParams();
  if (projectionDate) {
    params.append('projectionDate', projectionDate);
  }

  const { data, loading, error, refetch } = useApi<BalanceData>(`/api/balance?${params}`);

  return {
    currentBalance: data?.current_balance || 0,
    projectedBalance: data?.projected_balance || 0,
    projectionDate: data?.projection_date,
    details: data?.details,
    loading,
    error,
    refetch,
  };
} 