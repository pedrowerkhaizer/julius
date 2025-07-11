const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para parâmetros da timeline
const timelineQuerySchema = z.object({
  period: z.enum(['current', 'next', '3months', 'custom']).optional().default('current'),
  customStart: z.string().optional(),
  customEnd: z.string().optional()
});

/**
 * GET /api/timeline
 * Gerar timeline de eventos do usuário
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { period, customStart, customEnd } = timelineQuerySchema.parse(req.query);
    const userId = req.user.id;

    // Calcular range de datas
    let startDate, endDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case 'current':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'next':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
      case '3months':
        startDate = today;
        endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
        break;
      case 'custom':
        if (!customStart || !customEnd) {
          return res.status(400).json({
            success: false,
            error: 'customStart e customEnd são obrigatórios para período customizado'
          });
        }
        startDate = new Date(customStart);
        endDate = new Date(customEnd);
        break;
    }

    // Buscar transações recorrentes
    const { data: recurringTransactions, error: recurringError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .not('day', 'is', null);

    if (recurringError) throw recurringError;

    // Buscar transações únicas no período
    const { data: singleTransactions, error: singleError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', false)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (singleError) throw singleError;

    // Buscar cartões de crédito e faturas
    const { data: creditCards, error: cardsError } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId);

    if (cardsError) throw cardsError;

    // Buscar faturas no período
    const { data: invoices, error: invoicesError } = await supabase
      .from('credit_card_invoices')
      .select(`
        *,
        credit_cards!inner(*)
      `)
      .eq('credit_cards.user_id', userId);

    if (invoicesError) throw invoicesError;

    // Gerar eventos da timeline
    const timelineEvents = [];
    const groupedEvents = {};

    // Processar transações recorrentes
    recurringTransactions.forEach(transaction => {
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const occurrenceDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), transaction.day);
        
        if (occurrenceDate >= startDate && occurrenceDate <= endDate) {
          const dateKey = occurrenceDate.toISOString().split('T')[0];
          
          if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = [];
          }

          const event = {
            id: `${transaction.id}-${dateKey}`,
            type: 'transaction',
            transactionIdOriginal: transaction.id,
            date: dateKey,
            description: transaction.description,
            amount: transaction.amount,
            transactionType: transaction.type,
            expenseType: transaction.expense_type,
            isRecurring: true,
            day: transaction.day,
            occurrenceDate: dateKey
          };

          timelineEvents.push(event);
          groupedEvents[dateKey].push(event);
        }
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    });

    // Processar transações únicas
    singleTransactions.forEach(transaction => {
      const dateKey = transaction.date;
      
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }

      const event = {
        id: transaction.id,
        type: 'transaction',
        transactionIdOriginal: transaction.id,
        date: dateKey,
        description: transaction.description,
        amount: transaction.amount,
        transactionType: transaction.type,
        expenseType: transaction.expense_type,
        isRecurring: false
      };

      timelineEvents.push(event);
      groupedEvents[dateKey].push(event);
    });

    // Processar faturas de cartão de crédito
    invoices.forEach(invoice => {
      const [year, month] = invoice.month.split('-').map(Number);
      const card = creditCards.find(c => c.id === invoice.credit_card_id);
      
      if (card) {
        const dueDate = new Date(year, month - 1, card.due_day);
        const dateKey = dueDate.toISOString().split('T')[0];
        
        if (dueDate >= startDate && dueDate <= endDate) {
          if (!groupedEvents[dateKey]) {
            groupedEvents[dateKey] = [];
          }

          const event = {
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            invoiceId: invoice.id,
            date: dateKey,
            description: `Fatura ${card.name}`,
            amount: invoice.value,
            cardName: card.name,
            cardDueDay: card.due_day,
            month: invoice.month
          };

          timelineEvents.push(event);
          groupedEvents[dateKey].push(event);
        }
      }
    });

    // Ordenar eventos por data
    timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Ordenar eventos dentro de cada grupo por tipo e valor
    Object.keys(groupedEvents).forEach(dateKey => {
      groupedEvents[dateKey].sort((a, b) => {
        // Primeiro por tipo (income primeiro, depois expense, depois invoice)
        const typeOrder = { income: 1, expense: 2, invoice: 3 };
        const aType = a.transactionType || a.type;
        const bType = b.transactionType || b.type;
        
        if (typeOrder[aType] !== typeOrder[bType]) {
          return typeOrder[aType] - typeOrder[bType];
        }
        
        // Depois por valor (maior primeiro)
        return b.amount - a.amount;
      });
    });

    res.json({
      success: true,
      data: {
        events: timelineEvents,
        groupedEvents,
        dateRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao gerar timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 