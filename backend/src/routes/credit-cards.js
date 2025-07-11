const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para cartão de crédito
const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome do cartão é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  due_day: z.number().min(1).max(31, 'Dia de vencimento deve estar entre 1 e 31'),
  limit: z.number().optional(),
  closing_day: z.number().min(1).max(31).optional()
});

// Schema de validação para fatura
const invoiceSchema = z.object({
  credit_card_id: z.string().min(1, 'ID do cartão é obrigatório'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Mês deve estar no formato YYYY-MM'),
  value: z.number().min(0, 'Valor deve ser maior ou igual a zero')
});

/**
 * GET /api/credit-cards
 * Listar cartões de crédito do usuário
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar cartões de crédito:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/credit-cards
 * Criar novo cartão de crédito
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const cardData = creditCardSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('credit_cards')
      .insert([{
        ...cardData,
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
    console.error('Erro ao criar cartão de crédito:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/credit-cards/:id
 * Atualizar cartão de crédito
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = creditCardSchema.partial().parse(req.body);
    const userId = req.user.id;

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Cartão de crédito não encontrado'
      });
    }

    const { data, error } = await supabase
      .from('credit_cards')
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
    console.error('Erro ao atualizar cartão de crédito:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/credit-cards/:id
 * Deletar cartão de crédito
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Cartão de crédito não encontrado'
      });
    }

    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Cartão de crédito deletado com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao deletar cartão de crédito:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/credit-cards/:id/invoices
 * Listar faturas de um cartão de crédito
 */
router.get('/:id/invoices', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Cartão de crédito não encontrado'
      });
    }

    const { data, error } = await supabase
      .from('credit_card_invoices')
      .select('*')
      .eq('credit_card_id', id)
      .order('month', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/credit-cards/:id/invoices
 * Criar ou atualizar fatura de cartão de crédito
 */
router.post('/:id/invoices', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const invoiceData = invoiceSchema.parse(req.body);
    const userId = req.user.id;

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Cartão de crédito não encontrado'
      });
    }

    // Verificar se já existe uma fatura para este mês
    const { data: existingInvoice, error: checkError } = await supabase
      .from('credit_card_invoices')
      .select('id')
      .eq('credit_card_id', id)
      .eq('month', invoiceData.month)
      .single();

    let result;
    if (existingInvoice) {
      // Atualizar fatura existente
      const { data, error } = await supabase
        .from('credit_card_invoices')
        .update({
          value: invoiceData.value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInvoice.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Criar nova fatura
      const { data, error } = await supabase
        .from('credit_card_invoices')
        .insert([{
          ...invoiceData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao salvar fatura:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/credit-cards/:id/invoices/:invoiceId
 * Deletar fatura de cartão de crédito
 */
router.delete('/:id/invoices/:invoiceId', authenticateUser, async (req, res) => {
  try {
    const { id, invoiceId } = req.params;
    const userId = req.user.id;

    // Verificar se o cartão pertence ao usuário
    const { data: existingCard, error: fetchError } = await supabase
      .from('credit_cards')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({
        success: false,
        error: 'Cartão de crédito não encontrado'
      });
    }

    const { error } = await supabase
      .from('credit_card_invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('credit_card_id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Fatura deletada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao deletar fatura:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 