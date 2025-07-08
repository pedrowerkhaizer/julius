// =====================================================
// CONSTANTES CENTRALIZADAS
// =====================================================

import { BankInfo, CreditCardInfo } from '../types/finance';

/**
 * Lista de bancos disponíveis
 */
export const AVAILABLE_BANKS: BankInfo[] = [
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
 * Lista de cartões de crédito para assinaturas
 */
export const CREDIT_CARDS: CreditCardInfo[] = [
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
 * Tipos de conta bancária
 */
export const ACCOUNT_TYPES = {
  CHECKING: 'checking' as const,
  SAVINGS: 'savings' as const,
} as const;

/**
 * Tipos de transação
 */
export const TRANSACTION_TYPES = {
  INCOME: 'income' as const,
  EXPENSE: 'expense' as const,
} as const;

/**
 * Tipos de despesa
 */
export const EXPENSE_TYPES = {
  FIXED: 'fixed' as const,
  VARIABLE: 'variable' as const,
  SUBSCRIPTION: 'subscription' as const,
} as const;

/**
 * Filtros de período
 */
export const PERIOD_FILTERS = {
  CURRENT: 'current' as const,
  NEXT: 'next' as const,
  THREE_MONTHS: '3months' as const,
  CUSTOM: 'custom' as const,
} as const;

/**
 * Configurações de notificação
 */
export const NOTIFICATION_TYPES = {
  WEEKLY_SUMMARY: 'weekly_summary' as const,
  MONTHLY_PROJECTION: 'monthly_projection' as const,
  ALERTS: 'alerts' as const,
} as const;

/**
 * Dias da semana
 */
export const DAYS_OF_WEEK = [
  "domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"
] as const;

/**
 * Horários disponíveis para notificações
 */
export const NOTIFICATION_HOURS = [
  "08:00", "09:00", "12:00", "18:00", "20:00", "21:00"
] as const;

/**
 * Limites de validação
 */
export const VALIDATION_LIMITS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,
  MIN_DAY: 1,
  MAX_DAY: 28,
  MIN_DESCRIPTION_LENGTH: 1,
  MAX_DESCRIPTION_LENGTH: 100,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 50,
} as const;

/**
 * Mensagens de erro padrão
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_AMOUNT: 'Valor deve ser maior que zero',
  INVALID_DAY: 'Dia deve estar entre 1 e 28',
  INVALID_DATE: 'Data inválida',
  INVALID_EMAIL: 'Email inválido',
  INVALID_PHONE: 'Telefone inválido',
  MIN_LENGTH: (field: string, min: number) => `${field} deve ter pelo menos ${min} caracteres`,
  MAX_LENGTH: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  UNAUTHORIZED: 'Usuário não autenticado',
  NOT_FOUND: 'Recurso não encontrado',
  SERVER_ERROR: 'Erro interno do servidor',
} as const;

/**
 * Mensagens de sucesso padrão
 */
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Perfil atualizado com sucesso!',
  ACCOUNT_CREATED: 'Conta criada com sucesso!',
  ACCOUNT_UPDATED: 'Conta atualizada com sucesso!',
  ACCOUNT_DELETED: 'Conta removida com sucesso!',
  TRANSACTION_CREATED: 'Transação criada com sucesso!',
  TRANSACTION_UPDATED: 'Transação atualizada com sucesso!',
  TRANSACTION_DELETED: 'Transação removida com sucesso!',
  ONBOARDING_COMPLETED: 'Onboarding concluído com sucesso!',
} as const;

/**
 * Configurações de paginação
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Configurações de cache
 */
export const CACHE_CONFIG = {
  PROFILE_TTL: 5 * 60 * 1000, // 5 minutos
  ACCOUNTS_TTL: 2 * 60 * 1000, // 2 minutos
  TRANSACTIONS_TTL: 1 * 60 * 1000, // 1 minuto
} as const; 