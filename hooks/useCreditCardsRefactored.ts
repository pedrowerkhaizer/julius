import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  bank_id: string; // Adicionando campo obrigatório
  due_day: number;
  limit?: number;
  closing_day: number; // Tornando obrigatório
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreditCardInvoice {
  id: string;
  credit_card_id: string;
  month: string; // YYYY-MM
  value: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCreditCardData {
  name: string;
  bank: string;
  bank_id: string;
  due_day: number;
  limit?: number;
  closing_day?: number;
}

export interface UpdateCreditCardData {
  name?: string;
  bank?: string;
  due_day?: number;
  limit?: number;
  closing_day?: number;
}

export interface CreateInvoiceData {
  credit_card_id: string;
  month: string; // YYYY-MM
  value: number;
}

export function useCreditCardsRefactored() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: cardsData, loading: fetchLoading, error: fetchError, refetch } = useApi<CreditCard[]>('/api/credit-cards');

  // Atualizar estado local quando dados da API mudarem
  useEffect(() => {
    if (cardsData?.success && cardsData.data) {
      setCards(cardsData.data);
    }
  }, [cardsData]);

  useEffect(() => {
    setLoading(fetchLoading);
  }, [fetchLoading]);

  useEffect(() => {
    setError(fetchError);
  }, [fetchError]);

  // Função para adicionar cartão
  const createCard = useCallback(async (cardData: CreateCreditCardData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credit-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(cardData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar cartão');
      }

      // Recarregar lista de cartões
      await refetch();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [refetch]);

  // Função para atualizar cartão
  const updateCard = useCallback(async (id: string, cardData: UpdateCreditCardData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credit-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(cardData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar cartão');
      }

      // Recarregar lista de cartões
      await refetch();
      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [refetch]);

  // Função para deletar cartão
  const deleteCard = useCallback(async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credit-cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar cartão');
      }

      // Recarregar lista de cartões
      await refetch();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [refetch]);

  // Função para buscar faturas de um cartão
  const getInvoices = useCallback(async (cardId: string): Promise<CreditCardInvoice[]> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credit-cards/${cardId}/invoices`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar faturas');
      }

      return result.data || [];
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para salvar/atualizar fatura
  const upsertInvoice = useCallback(async (invoiceData: CreateInvoiceData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credit-cards/${invoiceData.credit_card_id}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(invoiceData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar fatura');
      }

      return result.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Função para deletar fatura
  const deleteInvoice = useCallback(async (cardId: string, invoiceId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/credit-cards/${cardId}/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar fatura');
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    cards,
    loading,
    error,
    createCard,
    updateCard,
    deleteCard,
    getInvoices,
    upsertInvoice,
    deleteInvoice,
    refetch
  };
} 