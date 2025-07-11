const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const supabase = require('../config/supabase');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para conta bancária
const bankAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório'),
  bank: z.string().min(1, 'Banco é obrigatório'),
  account_type: z.enum(['checking', 'savings']),
  balance: z.number().min(0, 'Saldo deve ser maior ou igual a zero'),
  balance_date: z.string().optional()
});

/**
 * GET /api/bank-accounts
 * Listar contas bancárias do usuário
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('bank_accounts')
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
    console.error('Erro ao buscar contas bancárias:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/bank-accounts
 * Criar nova conta bancária
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const accountData = bankAccountSchema.parse(req.body);
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([{
        ...accountData,
        user_id: userId,
        balance_date: accountData.balance_date || new Date().toISOString().split('T')[0],
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
    console.error('Erro ao criar conta bancária:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * PUT /api/bank-accounts/:id
 * Atualizar conta bancária
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = bankAccountSchema.partial().parse(req.body);
    const userId = req.user.id;

    // Verificar se a conta pertence ao usuário
    const { data: existingAccount, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingAccount) {
      return res.status(404).json({
        success: false,
        error: 'Conta bancária não encontrada'
      });
    }

    const { data, error } = await supabase
      .from('bank_accounts')
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
    console.error('Erro ao atualizar conta bancária:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * DELETE /api/bank-accounts/:id
 * Deletar conta bancária
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se a conta pertence ao usuário
    const { data: existingAccount, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existingAccount) {
      return res.status(404).json({
        success: false,
        error: 'Conta bancária não encontrada'
      });
    }

    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Conta bancária deletada com sucesso',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao deletar conta bancária:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 