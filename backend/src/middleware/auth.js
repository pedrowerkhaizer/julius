const supabase = require('../config/supabase');

/**
 * Middleware para verificar autenticação via JWT
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autenticação não fornecido' 
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    
    // Verificar o token com Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        error: 'Token inválido ou expirado' 
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ 
      error: 'Erro interno na autenticação' 
    });
  }
};

/**
 * Middleware para autenticação opcional (para endpoints que podem funcionar sem auth)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
}; 