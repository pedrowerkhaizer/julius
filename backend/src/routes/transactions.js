const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para transação
const transactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['income', 'expense']),
  expense_type: z.enum(['fixed', 'variable', 'subscription']).optional(),
  is_recurring: z.boolean().default(false),
  day: z.number().min(1).max(31).optional(),
  date: z.string().optional(),
  recurrence_end_date: z.string().optional(),
  subscription_card: z.string().optional(),
  subscription_billing_day: z.number().min(1).max(31).optional(),
  subscription_card_due_day: z.number().min(1).max(31).optional()
});

/**
 * GET /api/transactions
 * Listar transações do usuário
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, expense_type, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    if (expense_type) {
      query = query.eq('expense_type', expense_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: data?.length || 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/transactions
 * Criar nova transação
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const transactionData = transactionSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        ...transactionData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/transactions/:id
 * Atualizar transação
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = transactionSchema.partial().parse(req.body);
    const userId = req.user.id;

    // Verificar se a transação pertence ao usuário
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transação não encontrada'
      });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/transactions/:id
 * Deletar transação
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se a transação pertence ao usuário
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingTransaction) {
      return res.status(404).json({
        success: false,
        error: 'Transação não encontrada'
      });
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Transação deletada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 