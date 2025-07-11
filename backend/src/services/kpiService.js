const { addMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } = require('date-fns');
const supabase = require('../config/supabase');

/**
 * Serviço para cálculos de KPIs
 */
class KPIService {
  /**
   * Calcular KPIs para um usuário
   */
  async calculateKPIs(userId, period = 'current', customStart = null, customEnd = null) {
    try {
      // Buscar dados do usuário
      const [transactions, bankAccounts, creditCards, invoices] = await Promise.all([
        this.getTransactions(userId),
        this.getBankAccounts(userId),
        this.getCreditCards(userId),
        this.getCreditCardInvoices(userId)
      ]);

      // Calcular período
      const dateRange = this.calculateDateRange(period, customStart, customEnd);
      
      // Calcular transações do período
      const periodTransactions = this.calculatePeriodTransactions(transactions, dateRange);
      
      // Calcular faturas do período
      const invoicesExpense = this.calculateInvoicesExpense(invoices, dateRange);
      
      // Calcular KPIs
      const kpis = this.calculateKPIData(periodTransactions, bankAccounts, invoicesExpense);
      
      return {
        kpis,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString()
        },
        periodTransactions: periodTransactions.length
      };
    } catch (error) {
      console.error('Erro ao calcular KPIs:', error);
      throw new Error('Falha ao calcular KPIs');
    }
  }

  /**
   * Calcular período baseado no tipo
   */
  calculateDateRange(period, customStart, customEnd) {
    const today = new Date();
    let rangeStart, rangeEnd;
    
    switch (period) {
      case "current":
        rangeStart = startOfMonth(today);
        rangeEnd = endOfMonth(today);
        break;
      case "next":
        const next = addMonths(today, 1);
        rangeStart = startOfMonth(next);
        rangeEnd = endOfMonth(next);
        break;
      case "3months":
        rangeStart = startOfMonth(today);
        rangeEnd = endOfMonth(addMonths(today, 2));
        break;
      case "custom":
        rangeStart = parseISO(customStart || today.toISOString().split("T")[0]);
        rangeEnd = parseISO(customEnd || today.toISOString().split("T")[0]);
        break;
      default:
        rangeStart = startOfMonth(today);
        rangeEnd = endOfMonth(today);
    }
    
    return { start: rangeStart, end: rangeEnd };
  }

  /**
   * Calcular transações do período
   */
  calculatePeriodTransactions(transactions, dateRange) {
    return transactions.filter(transaction => {
      if (transaction.is_recurring) {
        if (transaction.day) {
          const transactionDate = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), transaction.day);
          return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
        }
        return false;
      } else {
        if (transaction.date) {
          const transactionDate = parseISO(transaction.date);
          return isWithinInterval(transactionDate, { start: dateRange.start, end: dateRange.end });
        }
        return false;
      }
    });
  }

  /**
   * Calcular faturas do período
   */
  calculateInvoicesExpense(invoices, dateRange) {
    let total = 0;
    invoices.forEach(invoice => {
      const [year, month] = invoice.month.split('-').map(Number);
      const invoiceDate = new Date(year, month - 1, 1);
      if (invoiceDate >= startOfMonth(dateRange.start) && invoiceDate <= endOfMonth(dateRange.end)) {
        total += invoice.value;
      }
    });
    return total;
  }

  /**
   * Calcular dados dos KPIs
   */
  calculateKPIData(periodTransactions, bankAccounts, invoicesExpense) {
    const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthPerformance = totalIncome - totalExpense;
    
    const fixedExpenses = expenseTransactions.filter(t => t.expense_type === 'fixed');
    const variableExpenses = expenseTransactions.filter(t => t.expense_type === 'variable');
    const subscriptionExpenses = expenseTransactions.filter(t => t.expense_type === 'subscription');
    
    const totalFixedExpense = fixedExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalVariableExpense = variableExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalSubscriptionExpense = subscriptionExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    const totalAccountBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
    
    return [
      {
        key: 'income',
        title: 'Entradas',
        value: totalIncome,
        icon: 'TrendingUp',
        color: 'lime',
        subtitle: incomeTransactions.length === 0 ? 'Nenhuma entrada no período' : `${incomeTransactions.length} entrada(s) no período`,
        count: incomeTransactions.length
      },
      {
        key: 'expense',
        title: 'Saídas',
        value: totalExpense,
        icon: 'TrendingDown',
        color: 'red',
        subtitle: expenseTransactions.length === 0 && invoicesExpense === 0 ? 'Nenhuma saída no período' : `${expenseTransactions.length + (invoicesExpense > 0 ? 1 : 0)} saída(s) no período`,
        count: expenseTransactions.length + (invoicesExpense > 0 ? 1 : 0)
      },
      {
        key: 'fixed',
        title: 'Fixas',
        value: totalFixedExpense,
        icon: 'AlertCircle',
        color: 'orange',
        subtitle: fixedExpenses.length === 0 ? 'Nenhuma despesa fixa no período' : `${fixedExpenses.length} despesa(s) fixa(s) no período`,
        count: fixedExpenses.length
      },
      {
        key: 'variable',
        title: 'Variáveis',
        value: totalVariableExpense,
        icon: 'AlertCircle',
        color: 'purple',
        subtitle: variableExpenses.length === 0 ? 'Nenhuma despesa variável no período' : `${variableExpenses.length} despesa(s) variável(is) no período`,
        count: variableExpenses.length
      },
      {
        key: 'subscription',
        title: 'Assinaturas',
        value: totalSubscriptionExpense,
        icon: 'CreditCard',
        color: 'blue',
        subtitle: subscriptionExpenses.length === 0 ? 'Nenhuma assinatura no período' : `${subscriptionExpenses.length} assinatura(s) no período`,
        count: subscriptionExpenses.length
      },
      {
        key: 'performance',
        title: 'Performance do Mês',
        value: monthPerformance,
        icon: 'TrendingUp',
        color: monthPerformance > 0 ? 'lime' : monthPerformance < 0 ? 'red' : 'blue',
        subtitle: monthPerformance > 0 ? 'Saldo positivo no período' : monthPerformance < 0 ? 'Saldo negativo no período' : 'Equilíbrio no período',
        count: 0
      },
      {
        key: 'balance',
        title: 'Saldo das Contas',
        value: totalAccountBalance,
        icon: 'Building2',
        color: 'blue',
        subtitle: bankAccounts.length === 0 ? 'Nenhuma conta configurada' : `${bankAccounts.length} conta(s) configurada(s)`,
        count: bankAccounts.length
      }
    ];
  }

  /**
   * Buscar transações do usuário
   */
  async getTransactions(userId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Buscar contas bancárias do usuário
   */
  async getBankAccounts(userId) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Buscar cartões de crédito do usuário
   */
  async getCreditCards(userId) {
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Buscar faturas de cartão de crédito do usuário
   */
  async getCreditCardInvoices(userId) {
    const { data, error } = await supabase
      .from('credit_card_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

module.exports = new KPIService(); 