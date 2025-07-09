import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Transaction, CreateTransactionData, UpdateTransactionData } from '@/lib/types/finance';
import { toast } from 'sonner';

export interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  loadTransactions: () => Promise<void>;
  addTransaction: (data: CreateTransactionData) => Promise<Transaction>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  updateRecurrenceException: (transactionId: string, date: string, data: Partial<Transaction>) => Promise<void>;
  deleteRecurrenceException: (transactionId: string, date: string) => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setTransactions(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar transações';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (data: CreateTransactionData): Promise<Transaction> => {
    try {
      setError(null);
      console.log('[useTransactions] addTransaction chamado', data);
      console.log('[useTransactions] antes do insert');
      const { data: newTransaction, error: insertError } = await supabase
        .from('transactions')
        .insert([data])
        .select()
        .single();
      console.log('[useTransactions] depois do insert');
      console.log('[useTransactions] Supabase retorno', { newTransaction, insertError });
      if (insertError) {
        throw insertError;
      }
      setTransactions(prev => [...prev, newTransaction]);
      toast.success('Transação adicionada com sucesso!');
      return newTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateTransaction = async (id: string, data: UpdateTransactionData): Promise<Transaction> => {
    try {
      setError(null);
      
      const { data: updatedTransaction, error: updateError } = await supabase
        .from('transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setTransactions(prev => 
        prev.map(t => t.id === id ? updatedTransaction : t)
      );
      toast.success('Transação atualizada com sucesso!');
      
      return updatedTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transação removida com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateRecurrenceException = async (
    transactionId: string, 
    date: string, 
    data: Partial<Transaction>
  ): Promise<void> => {
    try {
      setError(null);
      
      const { error: exceptionError } = await supabase
        .from('recurrence_exceptions')
        .upsert({
          transaction_id: transactionId,
          date,
          action: 'edit',
          override_amount: data.amount,
          override_description: data.description,
        });

      if (exceptionError) {
        throw exceptionError;
      }

      toast.success('Exceção de recorrência criada com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar exceção de recorrência';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteRecurrenceException = async (transactionId: string, date: string): Promise<void> => {
    try {
      setError(null);
      
      const { error: exceptionError } = await supabase
        .from('recurrence_exceptions')
        .upsert({
          transaction_id: transactionId,
          date,
          action: 'delete',
        });

      if (exceptionError) {
        throw exceptionError;
      }

      toast.success('Exceção de recorrência criada com sucesso!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar exceção de recorrência';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateRecurrenceException,
    deleteRecurrenceException,
  };
} 