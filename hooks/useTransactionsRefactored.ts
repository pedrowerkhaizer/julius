import { useState, useEffect } from 'react';
import { useApi } from './useApi';
import { Transaction } from '@/lib/types/finance';

interface TransactionData {
  transactions: Transaction[];
  total_count: number;
}

export function useTransactionsRefactored() {
  const { data, loading, error, refetch, mutate } = useApi<TransactionData>('/api/transactions');

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      await mutate(transaction);
      await refetch(); // Recarrega os dados após adicionar
    } catch (err) {
      console.error('Erro ao adicionar transação:', err);
      throw err;
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabaseClient')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar transação');
      }

      await refetch(); // Recarrega os dados após atualizar
    } catch (err) {
      console.error('Erro ao atualizar transação:', err);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await import('@/lib/supabaseClient')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar transação');
      }

      await refetch(); // Recarrega os dados após deletar
    } catch (err) {
      console.error('Erro ao deletar transação:', err);
      throw err;
    }
  };

  return {
    transactions: data?.transactions || [],
    loading,
    error,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refetch,
  };
} 