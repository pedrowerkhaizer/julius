import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export interface BankAccount {
  id: string;
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountData {
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date?: string;
}

export interface UpdateBankAccountData {
  name?: string;
  bank?: string;
  account_type?: 'checking' | 'savings';
  balance?: number;
  balance_date?: string;
}

export function useBankAccountsRefactored() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: accountsData, loading: fetchLoading, error: fetchError, refetch } = useApi<{ success: boolean; data: BankAccount[] }>('/api/bank-accounts');

  // Atualizar estado local quando dados da API mudarem
  useEffect(() => {
    if (accountsData?.success) {
      setAccounts(accountsData.data || []);
    }
  }, [accountsData]);

  useEffect(() => {
    setLoading(fetchLoading);
  }, [fetchLoading]);

  useEffect(() => {
    setError(fetchError);
  }, [fetchError]);

  // Função para adicionar conta
  const addAccount = useCallback(async (accountData: CreateBankAccountData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(accountData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao adicionar conta');
      }

      // Recarregar lista de contas
      await refetch();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [refetch]);

  // Função para atualizar conta
  const updateAccount = useCallback(async (id: string, accountData: UpdateBankAccountData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(accountData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar conta');
      }

      // Recarregar lista de contas
      await refetch();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [refetch]);

  // Função para deletar conta
  const deleteAccount = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bank-accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar conta');
      }

      // Recarregar lista de contas
      await refetch();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [refetch]);

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    refetch
  };
} 