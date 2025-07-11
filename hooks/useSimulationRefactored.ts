import { useState } from 'react';
import { useApi } from './useApi';

interface SimulationData {
  original_balance: number;
  new_balance: number;
  impact: number;
  is_affordable: boolean;
  recommendation: string;
}

interface SimulationRequest {
  amount: number;
  description: string;
  category?: string;
}

export function useSimulationRefactored() {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [simulating, setSimulating] = useState(false);

  const simulatePurchase = async (request: SimulationRequest) => {
    setSimulating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/simulation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabaseClient')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Erro ao simular compra');
      }

      const data = await response.json();
      setSimulationData(data);
      return data;
    } catch (err) {
      console.error('Erro na simulação:', err);
      throw err;
    } finally {
      setSimulating(false);
    }
  };

  return {
    simulationData,
    simulating,
    simulatePurchase,
  };
} 