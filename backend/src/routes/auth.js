const express = require('express');
const supabase = require('../config/supabase');

const router = express.Router();

/**
 * POST /api/auth/verify
 * Verificar token de autenticação
 */
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token é obrigatório'
      });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/auth/profile
 * Obter perfil do usuário
 */
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autenticação não fornecido'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado'
      });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile: profile || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router; 