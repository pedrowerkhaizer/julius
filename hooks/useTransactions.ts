"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Transaction, 
  CreateTransactionData, 
  UpdateTransactionData, 
  UseTransactionsReturn,
  RecurrenceException
} from '@/lib/types/finance';
import { toast } from 'sonner';

/**
 * Hook para gerenciar transações
 */
export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error('Falha ao carregar transações');
      }

      setTransactions(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar transações';
      setError(errorMessage);
      console.error('Erro em useTransactions.loadTransactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (transactionData: CreateTransactionData): Promise<Transaction> => {
    try {
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const user_id = authData.user.id;
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transactionData, user_id }])
        .select()
        .single();

      if (error) {
        throw new Error('Falha ao criar transação');
      }

      const newTransaction = data;
      setTransactions(prev => [...prev, newTransaction]);
      toast.success('Transação criada com sucesso!');
      
      return newTransaction;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updateData: UpdateTransactionData): Promise<Transaction> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Falha ao atualizar transação');
      }

      const updatedTransaction = data;
      setTransactions(prev => prev.map(transaction => 
        transaction.id === id ? updatedTransaction : transaction
      ));
      toast.success('Transação atualizada com sucesso!');
      
      return updatedTransaction;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Falha ao remover transação');
      }

      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      toast.success('Transação removida com sucesso!');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao remover transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Carrega as transações automaticamente quando o hook é montado
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    loadTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  };
}

/**
 * Hook para gerenciar exceções de recorrência
 */
export function useRecurrenceExceptions() {
  const [exceptions, setExceptions] = useState<RecurrenceException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExceptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('recurrence_exceptions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error('Falha ao carregar exceções de recorrência');
      }

      setExceptions(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar exceções';
      setError(errorMessage);
      console.error('Erro em useRecurrenceExceptions.loadExceptions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addException = useCallback(async (exceptionData: Omit<RecurrenceException, 'id' | 'created_at'>): Promise<RecurrenceException> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('recurrence_exceptions')
        .insert([exceptionData])
        .select()
        .single();

      if (error) {
        throw new Error('Falha ao criar exceção');
      }

      const newException = data;
      setExceptions(prev => [...prev, newException]);
      
      return newException;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar exceção';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateException = useCallback(async (id: string, updateData: Partial<RecurrenceException>): Promise<RecurrenceException> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('recurrence_exceptions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Falha ao atualizar exceção');
      }

      const updatedException = data;
      setExceptions(prev => prev.map(exception => 
        exception.id === id ? updatedException : exception
      ));
      
      return updatedException;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar exceção';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteException = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('recurrence_exceptions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Falha ao remover exceção');
      }

      setExceptions(prev => prev.filter(exception => exception.id !== id));
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao remover exceção';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Carrega as exceções automaticamente quando o hook é montado
  useEffect(() => {
    loadExceptions();
  }, [loadExceptions]);

  return {
    exceptions,
    loading,
    error,
    loadExceptions,
    addException,
    updateException,
    deleteException,
  };
} 