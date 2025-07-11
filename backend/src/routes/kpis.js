const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const kpiService = require('../services/kpiService');
const { z } = require('zod');

const router = express.Router();

// Schema de validação para parâmetros de KPI
const kpiQuerySchema = z.object({
  period: z.enum(['current', 'next', '3months', 'custom']).optional().default('current'),
  customStart: z.string().optional(),
  customEnd: z.string().optional()
});

/**
 * GET /api/kpis
 * Obter KPIs do usuário
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { period, customStart, customEnd } = kpiQuerySchema.parse(req.query);
    const userId = req.user.id;

    const kpis = await kpiService.calculateKPIs(userId, period, customStart, customEnd);

    res.json({
      success: true,
      data: kpis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar KPIs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/kpis/:kpiKey
 * Obter detalhes de um KPI específico
 */
router.get('/:kpiKey', authenticateUser, async (req, res) => {
  try {
    const { kpiKey } = req.params;
    const { period, customStart, customEnd } = kpiQuerySchema.parse(req.query);
    const userId = req.user.id;

    const kpis = await kpiService.calculateKPIs(userId, period, customStart, customEnd);
    const kpi = kpis.kpis.find(k => k.key === kpiKey);

    if (!kpi) {
      return res.status(404).json({
        success: false,
        error: 'KPI não encontrado'
      });
    }

    res.json({
      success: true,
      data: kpi,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar KPI específico:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router; 