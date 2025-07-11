// Configuração da API do Backend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    KPIS: '/api/kpis',
    BALANCE: '/api/balance',
    SIMULATION: '/api/simulation',
    TRANSACTIONS: '/api/transactions',
    AUTH: '/api/auth',
  },
  TIMEOUT: 10000, // 10 segundos
};

// Função para obter o token de autenticação
export async function getAuthToken() {
  const { supabase } = await import('@/lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// Função para fazer requisições autenticadas
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
  }

  return response;
} 