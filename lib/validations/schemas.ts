import { z } from 'zod';

// =====================================================
// SCHEMAS DE VALIDAÇÃO COM ZOD
// =====================================================

/**
 * Schema para validação de perfil do usuário
 */
export const userProfileSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres'),
  whatsapp: z.string()
    .min(10, 'WhatsApp deve ter pelo menos 10 dígitos')
    .max(15, 'WhatsApp deve ter no máximo 15 dígitos')
    .regex(/^\+?[1-9]\d{1,14}$/, 'WhatsApp deve ser um número válido'),
  avatar_url: z.string().url().optional().or(z.literal('')),
});

/**
 * Schema para validação de conta bancária
 */
export const bankAccountSchema = z.object({
  name: z.string()
    .min(1, 'Nome da conta é obrigatório')
    .max(50, 'Nome da conta deve ter no máximo 50 caracteres'),
  bank: z.string()
    .min(1, 'Banco é obrigatório'),
  account_type: z.enum(['checking', 'savings'], {
    errorMap: () => ({ message: 'Tipo de conta deve ser corrente ou poupança' })
  }),
  balance: z.number()
    .min(0, 'Saldo deve ser maior ou igual a zero')
    .max(999999999.99, 'Saldo muito alto'),
  balance_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
});

/**
 * Schema para validação de transação
 */
export const transactionSchema = z.object({
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(100, 'Descrição deve ter no máximo 100 caracteres'),
  amount: z.number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(999999999.99, 'Valor muito alto'),
  is_recurring: z.boolean(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Tipo deve ser entrada ou saída' })
  }),
  expense_type: z.enum(['fixed', 'variable', 'subscription']).optional(),
  day: z.number()
    .min(1, 'Dia deve estar entre 1 e 28')
    .max(28, 'Dia deve estar entre 1 e 28')
    .optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  recurrence_end_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  subscription_card: z.string().optional(),
  subscription_billing_day: z.number()
    .min(1, 'Dia de cobrança deve estar entre 1 e 28')
    .max(28, 'Dia de cobrança deve estar entre 1 e 28')
    .optional(),
  subscription_card_due_day: z.number()
    .min(1, 'Dia de vencimento deve estar entre 1 e 28')
    .max(28, 'Dia de vencimento deve estar entre 1 e 28')
    .optional(),
}).refine((data) => {
  // Se é recorrente, deve ter dia
  if (data.is_recurring && !data.day) {
    return false;
  }
  // Se não é recorrente, deve ter data
  if (!data.is_recurring && !data.date) {
    return false;
  }
  return true;
}, {
  message: 'Transação recorrente deve ter dia, transação única deve ter data',
  path: ['day'],
});

/**
 * Schema para validação de exceção de recorrência
 */
export const recurrenceExceptionSchema = z.object({
  transaction_id: z.string().uuid('ID da transação deve ser um UUID válido'),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  action: z.enum(['edit', 'delete'], {
    errorMap: () => ({ message: 'Ação deve ser editar ou deletar' })
  }),
  override_amount: z.number()
    .min(0.01, 'Valor deve ser maior que zero')
    .max(999999999.99, 'Valor muito alto')
    .optional(),
  override_description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(100, 'Descrição deve ter no máximo 100 caracteres')
    .optional(),
  override_category: z.enum(['fixed', 'variable', 'subscription']).optional(),
});

/**
 * Schema para validação de configurações de notificação
 */
export const notificationConfigSchema = z.object({
  enabled: z.boolean(),
  day: z.string().min(1, 'Dia é obrigatório'),
  hour: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário deve estar no formato HH:MM')
    .optional(),
});

/**
 * Schema para validação de dados de onboarding
 */
export const onboardingDataSchema = z.object({
  profile: userProfileSchema,
  incomes: z.array(transactionSchema).min(1, 'Pelo menos uma receita é obrigatória'),
  expenses: z.array(transactionSchema).min(1, 'Pelo menos uma despesa é obrigatória'),
  accounts: z.array(bankAccountSchema).min(1, 'Pelo menos uma conta é obrigatória'),
});

/**
 * Schema para validação de filtros de período
 */
export const periodFilterSchema = z.object({
  period: z.enum(['current', 'next', '3months', 'custom'], {
    errorMap: () => ({ message: 'Período inválido' })
  }),
  customStart: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
  customEnd: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional(),
}).refine((data) => {
  if (data.period === 'custom') {
    if (!data.customStart || !data.customEnd) {
      return false;
    }
    const start = new Date(data.customStart);
    const end = new Date(data.customEnd);
    return start <= end;
  }
  return true;
}, {
  message: 'Data de início deve ser menor ou igual à data de fim',
  path: ['customStart'],
});

// =====================================================
// TIPOS INFERIDOS DOS SCHEMAS
// =====================================================

export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type BankAccountInput = z.infer<typeof bankAccountSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type RecurrenceExceptionInput = z.infer<typeof recurrenceExceptionSchema>;
export type NotificationConfigInput = z.infer<typeof notificationConfigSchema>;
export type OnboardingDataInput = z.infer<typeof onboardingDataSchema>;
export type PeriodFilterInput = z.infer<typeof periodFilterSchema>;

// =====================================================
// FUNÇÕES DE VALIDAÇÃO
// =====================================================

/**
 * Valida dados de perfil do usuário
 */
export function validateUserProfile(data: unknown): UserProfileInput {
  return userProfileSchema.parse(data);
}

/**
 * Valida dados de conta bancária
 */
export function validateBankAccount(data: unknown): BankAccountInput {
  return bankAccountSchema.parse(data);
}

/**
 * Valida dados de transação
 */
export function validateTransaction(data: unknown): TransactionInput {
  return transactionSchema.parse(data);
}

/**
 * Valida dados de exceção de recorrência
 */
export function validateRecurrenceException(data: unknown): RecurrenceExceptionInput {
  return recurrenceExceptionSchema.parse(data);
}

/**
 * Valida dados de configuração de notificação
 */
export function validateNotificationConfig(data: unknown): NotificationConfigInput {
  return notificationConfigSchema.parse(data);
}

/**
 * Valida dados de onboarding
 */
export function validateOnboardingData(data: unknown): OnboardingDataInput {
  return onboardingDataSchema.parse(data);
}

/**
 * Valida filtros de período
 */
export function validatePeriodFilter(data: unknown): PeriodFilterInput {
  return periodFilterSchema.parse(data);
} 