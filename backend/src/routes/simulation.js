const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const balanceService = require('../services/balanceService');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para simulação
const simulationSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
  purchaseDate: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  projectionDate: z.string().optional().default(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
  })
});

/**
 * POST /api/simulation/purchase
 * Simular compra e retornar análise detalhada
 */
router.post('/purchase', authenticateUser, async (req, res) => {
  try {
    const { amount, description, purchaseDate, projectionDate } = simulationSchema.parse(req.body);
    const userId = req.user.id;

    // Obter saldo atual
    const currentBalance = await balanceService.getCurrentBalance(userId);
    
    // Obter saldo projetado sem a compra
    const projectedBalance = await balanceService.getProjectedBalance(userId, projectionDate);
    
    // Simular a compra
    const simulation = await balanceService.simulatePurchase(userId, amount, purchaseDate);

    // Análise detalhada
    const analysis = {
      purchase: {
        amount,
        description: description || 'Compra simulada',
        date: purchaseDate
      },
      currentBalance: currentBalance.totalBalance,
      projectedBalanceWithoutPurchase: projectedBalance.projectedBalance,
      projectedBalanceWithPurchase: simulation.newProjectedBalance,
      impact: {
        amount: amount,
        percentage: ((amount / currentBalance.totalBalance) * 100).toFixed(2)
      },
      recommendation: simulation.canAfford 
        ? '✅ Você pode fazer esta compra com segurança'
        : '⚠️ Esta compra pode comprometer suas finanças',
      details: {
        canAfford: simulation.canAfford,
        warning: simulation.warning,
        remainingBalance: simulation.newProjectedBalance,
        riskLevel: simulation.newProjectedBalance < 0 ? 'ALTO' : 
                  simulation.newProjectedBalance < (currentBalance.totalBalance * 0.1) ? 'MÉDIO' : 'BAIXO'
      }
    };

    res.json({
      success: true,
      data: analysis,
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

/**
 * POST /api/simulation/multiple-purchases
 * Simular múltiplas compras
 */
router.post('/multiple-purchases', authenticateUser, async (req, res) => {
  try {
    const { purchases } = req.body;
    
    if (!Array.isArray(purchases) || purchases.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Lista de compras é obrigatória'
      });
    }

    const userId = req.user.id;
    const currentBalance = await balanceService.getCurrentBalance(userId);
    
    let totalAmount = 0;
    const simulations = [];

    // Simular cada compra
    for (const purchase of purchases) {
      const { amount, description, purchaseDate } = purchase;
      
      if (!amount || amount <= 0) {
        continue;
      }

      const simulation = await balanceService.simulatePurchase(
        userId, 
        amount, 
        purchaseDate || new Date().toISOString().split('T')[0]
      );

      simulations.push({
        description: description || 'Compra simulada',
        amount,
        date: purchaseDate || new Date().toISOString().split('T')[0],
        impact: simulation.impact,
        canAfford: simulation.canAfford,
        warning: simulation.warning
      });

      totalAmount += amount;
    }

    // Análise geral
    const overallAnalysis = {
      totalPurchases: simulations.length,
      totalAmount,
      averageAmount: totalAmount / simulations.length,
      affordablePurchases: simulations.filter(s => s.canAfford).length,
      riskyPurchases: simulations.filter(s => !s.canAfford).length,
      totalImpact: totalAmount,
      recommendation: simulations.every(s => s.canAfford) 
        ? '✅ Todas as compras são viáveis'
        : '⚠️ Algumas compras podem comprometer suas finanças'
    };

    res.json({
      success: true,
      data: {
        simulations,
        overallAnalysis
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao simular múltiplas compras:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 