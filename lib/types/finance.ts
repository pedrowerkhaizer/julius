// =====================================================
// TIPOS PRINCIPAIS - DOMÍNIO FINANCEIRO
// =====================================================

export interface BankAccount {
  id: string;
  user_id: string;
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountData {
  name: string;
  bank: string;
  account_type: 'checking' | 'savings';
  balance: number;
  balance_date?: string;
}

export interface UpdateAccountData {
  name?: string;
  bank?: string;
  account_type?: 'checking' | 'savings';
  balance?: number;
  balance_date?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  is_recurring: boolean;
  type: 'income' | 'expense';
  expense_type?: 'fixed' | 'variable' | 'subscription';
  day?: number;
  date?: string;
  recurrence_end_date?: string;
  subscription_card?: string;
  subscription_billing_day?: number;
  subscription_card_due_day?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  is_recurring: boolean;
  type: 'income' | 'expense';
  expense_type?: 'fixed' | 'variable' | 'subscription';
  day?: number;
  date?: string;
  recurrence_end_date?: string;
  subscription_card?: string;
  subscription_billing_day?: number;
  subscription_card_due_day?: number;
  user_id?: string;
}

export interface UpdateTransactionData {
  description?: string;
  amount?: number;
  expense_type?: 'fixed' | 'variable' | 'subscription';
  day?: number;
  date?: string;
  recurrence_end_date?: string;
  subscription_card?: string;
  subscription_billing_day?: number;
  subscription_card_due_day?: number;
}

export interface RecurrenceException {
  id: string;
  transaction_id: string;
  date: string;
  action: 'edit' | 'delete';
  override_amount?: number;
  override_description?: string;
  override_category?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  nome: string;
  whatsapp: string;
  avatar_url?: string;
  onboarding_completed: boolean;
  notificacoes?: {
    weekly_summary?: NotificationConfig;
    monthly_projection?: NotificationConfig;
    alerts?: NotificationConfig;
  };
  created_at: string;
  updated_at: string;
}

export interface NotificationConfig {
  enabled: boolean;
  day: string;
  hour: string;
}

export interface AccountSummary {
  total_balance: number;
  total_accounts: number;
  last_updated: string;
}

export interface OnboardingConfig {
  completed: boolean;
  current_step: number;
  profile_completed: boolean;
  incomes_completed: boolean;
  expenses_completed: boolean;
  accounts_completed: boolean;
}

// =====================================================
// TIPOS PARA COMPONENTES E HOOKS
// =====================================================

export interface UseBankAccountsReturn {
  accounts: BankAccount[];
  loading: boolean;
  error: string | null;
  loadAccounts: () => Promise<void>;
  addAccount: (data: CreateAccountData) => Promise<BankAccount>;
  updateAccount: (id: string, data: UpdateAccountData) => Promise<BankAccount>;
  deleteAccount: (id: string) => Promise<void>;
}

export interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  loadTransactions: () => Promise<void>;
  addTransaction: (data: CreateTransactionData) => Promise<Transaction>;
  updateTransaction: (id: string, data: UpdateTransactionData) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
}

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loadProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  createProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
}

// =====================================================
// TIPOS PARA UTILITÁRIOS
// =====================================================

export interface BankInfo {
  id: string;
  name: string;
}

export interface CreditCardInfo {
  id: string;
  name: string;
}

export type PeriodFilter = 'current' | 'next' | '3months' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TransactionOccurrence {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  expenseType?: 'fixed' | 'variable' | 'subscription';
  dateObj: Date;
  dateStr: string;
  isException: boolean;
  transactionIdOriginal: string;
  subscriptionCard?: string;
  subscriptionBillingDay?: number;
  subscriptionCardDueDay?: number;
}

export interface CreditCard {
  id: string;
  user_id: string;
  bank_id: string;
  name: string;
  closing_day: number;
  due_day: number;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditCardInvoice {
  id: string;
  user_id: string;
  credit_card_id: string;
  month: string; // 'YYYY-MM'
  value: number;
  created_at: string;
  updated_at: string;
} 