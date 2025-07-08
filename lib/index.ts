// =====================================================
// EXPORTAÇÕES CENTRALIZADAS
// =====================================================

// Tipos
export * from './types/finance';

// Utilitários
export * from './utils/dateUtils';
export * from './utils/currencyUtils';
export * from './utils/constants';

// Cliente Supabase
export { supabase } from './supabaseClient';

// Funções de banco de dados (apenas funções específicas)
export { 
  getUserProfile, 
  updateUserProfile, 
  createUserProfile 
} from './supabaseClient'; 