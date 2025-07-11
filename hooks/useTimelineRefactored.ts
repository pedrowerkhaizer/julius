import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export interface TimelineEvent {
  id: string;
  type: 'transaction' | 'invoice';
  date: string;
  description: string;
  amount: number;
  transactionType?: 'income' | 'expense';
  expenseType?: 'fixed' | 'variable' | 'subscription';
  isRecurring?: boolean;
  day?: number;
  occurrenceDate?: string;
  transactionIdOriginal?: string;
  invoiceId?: string;
  cardName?: string;
  cardDueDay?: number;
  month?: string;
}

export interface TimelineData {
  events: TimelineEvent[];
  groupedEvents: Record<string, TimelineEvent[]>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface TimelineParams {
  period?: 'current' | 'next' | '3months' | 'custom';
  customStart?: string;
  customEnd?: string;
}

export function useTimelineRefactored(params: TimelineParams = {}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<Record<string, TimelineEvent[]>>({});
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Construir query string para os parâmetros
  const queryParams = new URLSearchParams();
  if (params.period) queryParams.append('period', params.period);
  if (params.customStart) queryParams.append('customStart', params.customStart);
  if (params.customEnd) queryParams.append('customEnd', params.customEnd);

  const endpoint = `/api/timeline${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  const { data: timelineData, loading: fetchLoading, error: fetchError, refetch } = useApi<{ success: boolean; data: TimelineData }>(endpoint);

  // Atualizar estado local quando dados da API mudarem
  useEffect(() => {
    if (timelineData?.success) {
      setEvents(timelineData.data.events || []);
      setGroupedEvents(timelineData.data.groupedEvents || {});
      setDateRange(timelineData.data.dateRange || null);
    }
  }, [timelineData]);

  useEffect(() => {
    setLoading(fetchLoading);
  }, [fetchLoading]);

  useEffect(() => {
    setError(fetchError);
  }, [fetchError]);

  // Função para recarregar timeline com novos parâmetros
  const reloadTimeline = useCallback(async (newParams: TimelineParams) => {
    const newQueryParams = new URLSearchParams();
    if (newParams.period) newQueryParams.append('period', newParams.period);
    if (newParams.customStart) newQueryParams.append('customStart', newParams.customStart);
    if (newParams.customEnd) newQueryParams.append('customEnd', newParams.customEnd);

    const newEndpoint = `/api/timeline${newQueryParams.toString() ? `?${newQueryParams.toString()}` : ''}`;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${newEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao carregar timeline');
      }

      setEvents(result.data.events || []);
      setGroupedEvents(result.data.groupedEvents || {});
      setDateRange(result.data.dateRange || null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    events,
    groupedEvents,
    dateRange,
    loading,
    error,
    reloadTimeline,
    refetch
  };
} 