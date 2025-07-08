"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  BankAccount, 
  CreateAccountData, 
  UpdateAccountData, 
  UseBankAccountsReturn 
} from '@/lib/types/finance';
import { toast } from 'sonner';

/**
 * Hook para gerenciar contas bancárias
 */
export function useBankAccounts(): UseBankAccountsReturn {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error('Falha ao carregar contas bancárias');
      }

      setAccounts(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar contas bancárias';
      setError(errorMessage);
      console.error('Erro em useBankAccounts.loadAccounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (accountData: CreateAccountData): Promise<BankAccount> => {
    try {
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const user_id = authData.user.id;
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{ ...accountData, user_id }])
        .select()
        .single();

      if (error) {
        throw new Error('Falha ao criar conta bancária');
      }

      const newAccount = data;
      setAccounts(prev => [...prev, newAccount]);
      toast.success('Conta criada com sucesso!');
      
      return newAccount;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar conta bancária';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updateData: UpdateAccountData): Promise<BankAccount> => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Falha ao atualizar conta bancária');
      }

      const updatedAccount = data;
      setAccounts(prev => prev.map(account => 
        account.id === id ? updatedAccount : account
      ));
      toast.success('Conta atualizada com sucesso!');
      
      return updatedAccount;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar conta bancária';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteAccount = useCallback(async (id: string): Promise<void> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Falha ao remover conta bancária');
      }

      setAccounts(prev => prev.filter(account => account.id !== id));
      toast.success('Conta removida com sucesso!');
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao remover conta bancária';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Carrega as contas automaticamente quando o hook é montado
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  return {
    accounts,
    loading,
    error,
    loadAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
  };
} 