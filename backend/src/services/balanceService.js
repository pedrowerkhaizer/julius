const { addMonths } = require('date-fns');
const supabase = require('../config/supabase');

/**
 * Serviço para cálculos de saldo
 */
class BalanceService {
  /**
   * Calcular saldo atual
   */
  async getCurrentBalance(userId) {
    try {
      const bankAccounts = await this.getBankAccounts(userId);
      const totalBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
      
      return {
        totalBalance,
        accounts: bankAccounts.map(account => ({
          id: account.id,
          name: account.name,
          bank: account.bank,
          balance: account.balance,
          balance_date: account.balance_date
        }))
      };
    } catch (error) {
      console.error('Erro ao calcular saldo atual:', error);
      throw new Error('Falha ao calcular saldo atual');
    }
  }

  /**
   * Calcular saldo projetado até uma data específica
   */
  async getProjectedBalance(userId, projectionDate) {
    try {
      const [bankAccounts, transactions, creditCards, invoices] = await Promise.all([
        this.getBankAccounts(userId),
        this.getTransactions(userId),
        this.getCreditCards(userId),
        this.getCreditCardInvoices(userId)
      ]);

      const totalAccountBalance = bankAccounts.reduce((sum, account) => sum + account.balance, 0);
      
      // Filtrar transações de hoje até a data de projeção
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const projectionDateObj = new Date(projectionDate);
      projectionDateObj.setHours(23, 59, 59, 999);

      let projectedIncome = 0;
      let projectedExpense = 0;

      transactions.forEach(transaction => {
        if (transaction.is_recurring && transaction.day) {
          // Gerar todas as ocorrências entre hoje e a data de projeção
          let cursor = new Date(today);
          while (cursor <= projectionDateObj) {
            const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), transaction.day);
            if (occurrenceDate >= today && occurrenceDate <= projectionDateObj) {
              if (transaction.type === 'income') projectedIncome += transaction.amount;
              if (transaction.type === 'expense') projectedExpense += transaction.amount;
            }
            cursor.setMonth(cursor.getMonth() + 1);
          }
        } else if (transaction.date) {
          const transactionDate = new Date(transaction.date);
          if (transactionDate >= today && transactionDate <= projectionDateObj) {
            if (transaction.type === 'income') projectedIncome += transaction.amount;
            if (transaction.type === 'expense') projectedExpense += transaction.amount;
          }
        }
      });

      // Somar faturas de cartão de crédito cujo vencimento está entre hoje e a data de projeção
      let projectedInvoices = 0;
      creditCards.forEach(card => {
        const cardInvoices = invoices.filter(inv => inv.credit_card_id === card.id);
        cardInvoices.forEach(invoice => {
          // Calcular data de vencimento da fatura
          const [year, month] = invoice.month.split('-').map(Number);
          const dueDate = new Date(year, month - 1, card.due_day, 12); // Meio-dia para evitar fuso
          if (dueDate >= today && dueDate <= projectionDateObj) {
            projectedInvoices += invoice.value;
          }
        });
      });

      const projectedBalance = totalAccountBalance + projectedIncome - projectedExpense - projectedInvoices;

      return {
        currentBalance: totalAccountBalance,
        projectedBalance,
        projectionDate,
        details: {
          saldoInicial: totalAccountBalance,
          entradas: projectedIncome,
          fixas: transactions.filter(t => t.type === 'expense' && t.expense_type === 'fixed')
            .reduce((sum, t) => {
              if (t.is_recurring && t.day) {
                let cursor = new Date(today);
                let total = 0;
                while (cursor <= projectionDateObj) {
                  const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), t.day);
                  if (occurrenceDate >= today && occurrenceDate <= projectionDateObj) {
                    total += t.amount;
                  }
                  cursor.setMonth(cursor.getMonth() + 1);
                }
                return sum + total;
              } else if (t.date) {
                const transactionDate = new Date(t.date);
                if (transactionDate >= today && transactionDate <= projectionDateObj) {
                  return sum + t.amount;
                }
              }
              return sum;
            }, 0),
          variaveis: transactions.filter(t => t.type === 'expense' && t.expense_type === 'variable')
            .reduce((sum, t) => {
              if (t.is_recurring && t.day) {
                let cursor = new Date(today);
                let total = 0;
                while (cursor <= projectionDateObj) {
                  const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), t.day);
                  if (occurrenceDate >= today && occurrenceDate <= projectionDateObj) {
                    total += t.amount;
                  }
                  cursor.setMonth(cursor.getMonth() + 1);
                }
                return sum + total;
              } else if (t.date) {
                const transactionDate = new Date(t.date);
                if (transactionDate >= today && transactionDate <= projectionDateObj) {
                  return sum + t.amount;
                }
              }
              return sum;
            }, 0),
          assinaturas: transactions.filter(t => t.type === 'expense' && t.expense_type === 'subscription')
            .reduce((sum, t) => {
              if (t.is_recurring && t.day) {
                let cursor = new Date(today);
                let total = 0;
                while (cursor <= projectionDateObj) {
                  const occurrenceDate = new Date(cursor.getFullYear(), cursor.getMonth(), t.day);
                  if (occurrenceDate >= today && occurrenceDate <= projectionDateObj) {
                    total += t.amount;
                  }
                  cursor.setMonth(cursor.getMonth() + 1);
                }
                return sum + total;
              } else if (t.date) {
                const transactionDate = new Date(t.date);
                if (transactionDate >= today && transactionDate <= projectionDateObj) {
                  return sum + t.amount;
                }
              }
              return sum;
            }, 0),
          faturas: projectedInvoices
        }
      };
    } catch (error) {
      console.error('Erro ao calcular saldo projetado:', error);
      throw new Error('Falha ao calcular saldo projetado');
    }
  }

  /**
   * Simular compra e calcular novo saldo projetado
   */
  async simulatePurchase(userId, amount, purchaseDate = null) {
    try {
      const purchaseDateObj = purchaseDate ? new Date(purchaseDate) : new Date();
      const projectionDate = addMonths(purchaseDateObj, 1); // Projetar 1 mês à frente

      const projectedBalance = await this.getProjectedBalance(userId, projectionDate.toISOString().split('T')[0]);
      
      // Simular a compra
      const newProjectedBalance = projectedBalance.projectedBalance - amount;
      
      return {
        currentProjectedBalance: projectedBalance.projectedBalance,
        newProjectedBalance,
        purchaseAmount: amount,
        purchaseDate: purchaseDateObj.toISOString().split('T')[0],
        projectionDate: projectionDate.toISOString().split('T')[0],
        impact: amount,
        canAfford: newProjectedBalance >= 0,
        warning: newProjectedBalance < 0 ? 'Atenção: Esta compra pode deixar seu saldo negativo!' : null
      };
    } catch (error) {
      console.error('Erro ao simular compra:', error);
      throw new Error('Falha ao simular compra');
    }
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

module.exports = new BalanceService(); 