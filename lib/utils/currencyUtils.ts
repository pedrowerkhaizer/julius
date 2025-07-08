// =====================================================
// UTILITÁRIOS DE MOEDA E FORMATAÇÃO NUMÉRICA
// =====================================================

/**
 * Formata um valor monetário para exibição em português brasileiro
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Formata um valor monetário sem símbolo da moeda
 */
export function formatCurrencyValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte string de valor monetário para número
 */
export function parseCurrency(value: string): number {
  // Remove caracteres não numéricos exceto vírgula e ponto
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Substitui vírgula por ponto para conversão
  const normalizedValue = cleanValue.replace(',', '.');
  
  const parsed = parseFloat(normalizedValue);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formata um valor com prefixo de sinal (+ ou -)
 */
export function formatCurrencyWithSign(value: number, showPositiveSign = false): string {
  const formatted = formatCurrency(Math.abs(value));
  if (value > 0) {
    return showPositiveSign ? `+${formatted}` : formatted;
  } else if (value < 0) {
    return `-${formatted}`;
  }
  return formatted;
}

/**
 * Formata um valor percentual
 */
export function formatPercentage(value: number, decimals = 1): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Formata um número inteiro
 */
export function formatInteger(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/**
 * Formata um número decimal
 */
export function formatDecimal(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Valida se um valor é um número válido
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Arredonda um valor para 2 casas decimais
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula a diferença percentual entre dois valores
 */
export function calculatePercentageDifference(original: number, current: number): number {
  if (original === 0) return 0;
  return ((current - original) / original) * 100;
}

/**
 * Formata um valor para exibição compacta (ex: 1.5K, 2.3M)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
} 