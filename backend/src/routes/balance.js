const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const balanceService = require('../services/balanceService');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para saldo projetado
const projectedBalanceSchema = z.object({
  projectionDate: z.string().optional().default(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  })
});

// Schema de validação para simulação de compra
const purchaseSimulationSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  purchaseDate: z.string().optional().default(() => new Date().toISOString().split('T')[0])
});

/**
 * GET /api/balance/current
 * Obter saldo atual
 */
router.get('/current', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await balanceService.getCurrentBalance(userId);

    res.json({
      success: true,
      data: balance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar saldo atual:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/balance/projected
 * Obter saldo projetado
 */
router.get('/projected', authenticateUser, async (req, res) => {
  try {
    const { projectionDate } = projectedBalanceSchema.parse(req.query);
    const userId = req.user.id;

    const projectedBalance = await balanceService.getProjectedBalance(userId, projectionDate);

    res.json({
      success: true,
      data: projectedBalance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao calcular saldo projetado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/balance/simulate-purchase
 * Simular compra e calcular impacto no saldo
 */
router.post('/simulate-purchase', authenticateUser, async (req, res) => {
  try {
    const { amount, purchaseDate } = purchaseSimulationSchema.parse(req.body);
    const userId = req.user.id;

    const simulation = await balanceService.simulatePurchase(userId, amount, purchaseDate);

    res.json({
      success: true,
      data: simulation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao simular compra:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 