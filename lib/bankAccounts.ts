import { supabase } from './supabaseClient';
import { toast } from 'sonner';
import React from 'react';

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date?: string; // Data do saldo
  created_at: string;
  updated_at: string;
}

export interface OnboardingConfig {
  payment_day: number;
  card_due_day: number;
  onboarding_completed: boolean;
  completed_at: string;
}

export interface AccountSummary {
  total_accounts: number;
  checking_accounts: number;
  savings_accounts: number;
  total_balance: number;
  checking_balance: number;
  savings_balance: number;
  last_updated: string;
}

export interface CreateAccountData {
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date?: string; // Data do saldo
}

export interface UpdateAccountData {
  name?: string;
  bank?: string;
  account_type?: 'checking' | 'savings';
  balance?: number;
  balance_date?: string; // Data do saldo
}

// =====================================================
// FUNÇÕES PRINCIPAIS - CONTAS BANCÁRIAS
// =====================================================

/**
 * Busca todas as contas bancárias do usuário autenticado
 */
export async function getUserBankAccounts(): Promise<BankAccount[]> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      throw new Error('Falha ao carregar contas bancárias');
    }

    return data || [];
  } catch (error) {
    console.error('Erro em getUserBankAccounts:', error);
    throw error;
  }
}

/**
 * Busca uma conta bancária específica por ID
 */
export async function getBankAccount(accountId: string): Promise<BankAccount | null> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Conta não encontrada
      }
      console.error('Erro ao buscar conta bancária:', error);
      throw new Error('Falha ao carregar conta bancária');
    }

    return data;
  } catch (error) {
    console.error('Erro em getBankAccount:', error);
    throw error;
  }
}

/**
 * Cria uma nova conta bancária
 */
export async function createBankAccount(accountData: CreateAccountData): Promise<BankAccount> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user?.id) {
    throw new Error('Usuário não autenticado');
  }
  const user_id = userData.user.id;

  const { data, error } = await supabase
    .from('bank_accounts')
    .insert([{ ...accountData, user_id }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar conta bancária:', error);
    throw new Error('Falha ao criar conta bancária');
  }

  return data;
}

/**
 * Atualiza uma conta bancária existente
 */
export async function updateBankAccount(
  accountId: string, 
  updateData: UpdateAccountData
): Promise<BankAccount> {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar conta bancária:', error);
      throw new Error('Falha ao atualizar conta bancária');
    }

    return data;
  } catch (error) {
    console.error('Erro em updateBankAccount:', error);
    throw error;
  }
}

/**
 * Remove uma conta bancária
 */
export async function deleteBankAccount(accountId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', accountId);

    if (error) {
      console.error('Erro ao deletar conta bancária:', error);
      throw new Error('Falha ao deletar conta bancária');
    }
  } catch (error) {
    console.error('Erro em deleteBankAccount:', error);
    throw error;
  }
}

/**
 * Calcula o saldo total de todas as contas do usuário
 */
export async function getTotalBalance(): Promise<number> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_total_balance', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error('Erro ao calcular saldo total:', error);
      throw new Error('Falha ao calcular saldo total');
    }

    return data || 0;
  } catch (error) {
    console.error('Erro em getTotalBalance:', error);
    throw error;
  }
}

/**
 * Busca o resumo das contas do usuário
 */
export async function getAccountSummary(): Promise<AccountSummary | null> {
  try {
    const { data, error } = await supabase
      .from('user_accounts_summary')
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Usuário sem contas
      }
      console.error('Erro ao buscar resumo das contas:', error);
      throw new Error('Falha ao carregar resumo das contas');
    }

    return data;
  } catch (error) {
    console.error('Erro em getAccountSummary:', error);
    throw error;
  }
}

// =====================================================
// FUNÇÕES DE ONBOARDING
// =====================================================

/**
 * Salva a configuração de onboarding do usuário
 */
export async function saveOnboardingConfig(
  paymentDay: number, 
  cardDueDay: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('save_onboarding_config', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id,
        payment_day: paymentDay,
        card_due_day: cardDueDay
      });

    if (error) {
      console.error('Erro ao salvar configuração de onboarding:', error);
      throw new Error('Falha ao salvar configuração de onboarding');
    }

    return data;
  } catch (error) {
    console.error('Erro em saveOnboardingConfig:', error);
    throw error;
  }
}

/**
 * Busca a configuração de onboarding do usuário
 */
export async function getOnboardingConfig(): Promise<OnboardingConfig | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_onboarding_config', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id
      });

    if (error) {
      console.error('Erro ao buscar configuração de onboarding:', error);
      throw new Error('Falha ao carregar configuração de onboarding');
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro em getOnboardingConfig:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário completou o onboarding
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  try {
    const config = await getOnboardingConfig();
    return config?.onboarding_completed || false;
  } catch (error) {
    console.error('Erro em isOnboardingCompleted:', error);
    return false;
  }
}

// =====================================================
// MIGRAÇÃO DE DADOS DO LOCALSTORAGE
// =====================================================

/**
 * Migra dados do localStorage para o Supabase
 */
export async function migrateFromLocalStorage(): Promise<number> {
  try {
    // Buscar dados do localStorage
    const onboardingData = localStorage.getItem('julius_onboarding');
    if (!onboardingData) {
      return 0; // Nenhum dado para migrar
    }

    const parsedData = JSON.parse(onboardingData);
    const { bankAccounts, paymentDay, cardDueDay } = parsedData;

    if (!bankAccounts || bankAccounts.length === 0) {
      return 0; // Nenhuma conta para migrar
    }

    // Preparar dados para migração
    const accountsJson = JSON.stringify(bankAccounts.map((account: any) => ({
      name: account.name,
      bank: account.bank,
      accountType: account.accountType,
      balance: account.balance
    })));

    // Executar migração via RPC
    const { data, error } = await supabase
      .rpc('migrate_localstorage_accounts', {
        user_uuid: (await supabase.auth.getUser()).data.user?.id,
        accounts_json: accountsJson,
        payment_day: paymentDay || null,
        card_due_day: cardDueDay || null
      });

    if (error) {
      console.error('Erro na migração:', error);
      throw new Error('Falha na migração dos dados');
    }

    // Limpar localStorage após migração bem-sucedida
    localStorage.removeItem('julius_onboarding');

    return data || 0;
  } catch (error) {
    console.error('Erro em migrateFromLocalStorage:', error);
    throw error;
  }
}

/**
 * Verifica se há dados no localStorage para migrar
 */
export function hasLocalStorageData(): boolean {
  try {
    const onboardingData = localStorage.getItem('julius_onboarding');
    if (!onboardingData) return false;

    const parsedData = JSON.parse(onboardingData);
    return parsedData.bankAccounts && parsedData.bankAccounts.length > 0;
  } catch (error) {
    console.error('Erro ao verificar localStorage:', error);
    return false;
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

/**
 * Formata valor monetário para exibição
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Valida dados de uma conta bancária
 */
export function validateAccountData(data: CreateAccountData): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Nome da conta é obrigatório');
  }

  if (!data.bank || data.bank.trim().length === 0) {
    errors.push('Banco é obrigatório');
  }

  if (!data.account_type || !['checking', 'savings'].includes(data.account_type)) {
    errors.push('Tipo de conta deve ser "checking" ou "savings"');
  }

  if (typeof data.balance !== 'number' || data.balance < 0) {
    errors.push('Saldo deve ser um número positivo');
  }

  return errors;
}

/**
 * Lista de bancos disponíveis
 */
export const AVAILABLE_BANKS = [
  { id: "nubank", name: "Nubank" },
  { id: "itau", name: "Itaú" },
  { id: "bradesco", name: "Bradesco" },
  { id: "santander", name: "Santander" },
  { id: "bb", name: "Banco do Brasil" },
  { id: "caixa", name: "Caixa Econômica" },
  { id: "inter", name: "Banco Inter" },
  { id: "c6", name: "C6 Bank" },
  { id: "picpay", name: "PicPay" },
  { id: "mercadopago", name: "Mercado Pago" },
  { id: "outro", name: "Outro" },
];

/**
 * Busca o nome do banco pelo ID
 */
export function getBankName(bankId: string): string {
  const bank = AVAILABLE_BANKS.find(b => b.id === bankId);
  return bank ? bank.name : bankId;
}

/**
 * Busca o tipo de conta em português
 */
export function getAccountTypeName(accountType: string): string {
  return accountType === 'checking' ? 'Conta Corrente' : 'Poupança';
}

// =====================================================
// HOOKS PARA REACT (OPCIONAL)
// =====================================================

/**
 * Hook para gerenciar estado das contas bancárias
 */
export function useBankAccounts() {
  const [accounts, setAccounts] = React.useState<BankAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserBankAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = React.useCallback(async (accountData: CreateAccountData) => {
    try {
      const newAccount = await createBankAccount(accountData);
      setAccounts(prev => [...prev, newAccount]);
      return newAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  }, []);

  const updateAccount = React.useCallback(async (id: string, updateData: UpdateAccountData) => {
    try {
      const updatedAccount = await updateBankAccount(id, updateData);
      setAccounts(prev => prev.map(account => 
        account.id === id ? updatedAccount : account
      ));
      return updatedAccount;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  }, []);

  const deleteAccount = React.useCallback(async (id: string) => {
    try {
      await deleteBankAccount(id);
      setAccounts(prev => prev.filter(account => account.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    }
  }, []);

  React.useEffect(() => {
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

// =====================================================
// EXPORTAÇÕES
// =====================================================

export default {
  // Contas bancárias
  getUserBankAccounts,
  getBankAccount,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  getTotalBalance,
  getAccountSummary,
  
  // Onboarding
  saveOnboardingConfig,
  getOnboardingConfig,
  isOnboardingCompleted,
  
  // Migração
  migrateFromLocalStorage,
  hasLocalStorageData,
  
  // Utilitários
  formatCurrency,
  validateAccountData,
  AVAILABLE_BANKS,
  getBankName,
  getAccountTypeName,
  
  // Hooks
  useBankAccounts,
}; 