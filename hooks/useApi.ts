import { useState, useEffect } from 'react';
import { API_CONFIG, apiRequest } from '@/lib/apiConfig';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export function useApi<T>(
  endpoint: string,
  options: ApiCallOptions = {}
): ApiResponse<T> & {
  refetch: () => Promise<void>;
  mutate: (data: any) => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = async (requestOptions: ApiCallOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest(endpoint, {
        method: requestOptions.method || options.method || 'GET',
        body: requestOptions.body || options.body ? JSON.stringify(requestOptions.body || options.body) : undefined,
        headers: {
          ...options.headers,
          ...requestOptions.headers,
        },
      });

      const result = await response.json();
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro na requisição';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await makeRequest();
  };

  const mutate = async (newData: any) => {
    await makeRequest({ method: 'POST', body: newData });
  };

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
  };
}

// Hook específico para KPIs
export function useKPIsApi(period: string, customStart?: string, customEnd?: string) {
  const params = new URLSearchParams({
    period,
    ...(customStart && { customStart }),
    ...(customEnd && { customEnd }),
  });

  return useApi<any>(`${API_CONFIG.ENDPOINTS.KPIS}?${params}`);
}

// Hook específico para saldo
export function useBalanceApi() {
  return useApi<any>(API_CONFIG.ENDPOINTS.BALANCE);
}

// Hook específico para simulação
export function useSimulationApi() {
  return useApi<any>(API_CONFIG.ENDPOINTS.SIMULATION);
}

// Hook específico para transações
export function useTransactionsApi() {
  return useApi<any>(API_CONFIG.ENDPOINTS.TRANSACTIONS);
} 