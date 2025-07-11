// Configuração da API do Backend
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    KPIS: '/api/kpis',
    BALANCE: '/api/balance',
    SIMULATION: '/api/simulation',
    TRANSACTIONS: '/api/transactions',
    BANK_ACCOUNTS: '/api/bank-accounts',
    CREDIT_CARDS: '/api/credit-cards',
    TIMELINE: '/api/timeline',
    AUTH: '/api/auth',
  }
};

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('supabase.auth.token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; error?: string }> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const headers = getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro na requisição');
  }
  
  return result;
} 