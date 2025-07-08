// =====================================================
// UTILITÁRIOS DE DATA
// =====================================================

/**
 * Formata uma data de forma amigável (ex: "15 jan")
 */
export function formatDateFriendly(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('pt-BR', { month: 'short' });
  const year = d.getFullYear();
  
  if (year === now.getFullYear()) {
    return `${day} ${month}`;
  } else {
    return `${day} ${month} ${year}`;
  }
}

/**
 * Formata uma data para timeline (ex: "segunda-feira, 15 de janeiro")
 */
export function formatTimelineDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const dayOfWeek = d.toLocaleString('pt-BR', { weekday: 'long' });
  const day = d.getDate().toString().padStart(2, '0');
  const month = d.toLocaleString('pt-BR', { month: 'long' });
  const year = d.getFullYear();
  
  if (year === now.getFullYear()) {
    return `${dayOfWeek}, ${day} de ${month}`;
  } else {
    return `${dayOfWeek}, ${day} de ${month} de ${year}`;
  }
}

/**
 * Retorna a data de hoje no formato ISO (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calcula a data efetiva de uma assinatura baseada no dia de cobrança e vencimento do cartão
 */
export function calculateSubscriptionDate(billingDay: number, cardDueDay: number): Date {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Se a data de cobrança é depois do vencimento do cartão, vai para o próximo mês
  if (billingDay > cardDueDay) {
    return new Date(currentYear, currentMonth + 1, billingDay);
  } else {
    return new Date(currentYear, currentMonth, billingDay);
  }
}

/**
 * Verifica se uma data está dentro de um intervalo
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

/**
 * Formata uma data para exibição em inputs de data
 */
export function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Converte string de data para objeto Date
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Retorna o primeiro dia do mês
 */
export function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Retorna o último dia do mês
 */
export function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * Adiciona meses a uma data
 */
export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

/**
 * Verifica se uma data é válida
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Retorna a diferença em dias entre duas datas
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Retorna a diferença em meses entre duas datas
 */
export function getMonthsDifference(date1: Date, date2: Date): number {
  return (date2.getFullYear() - date1.getFullYear()) * 12 + 
         (date2.getMonth() - date1.getMonth());
} 