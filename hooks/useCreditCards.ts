import { useState, useEffect } from 'react';
import { getUserCreditCards, createCreditCard, updateCreditCard, deleteCreditCard, getCreditCardInvoices, upsertCreditCardInvoice } from '@/lib/creditCards';
import { CreditCard, CreditCardInvoice } from '@/lib/types/finance';

export function useCreditCards(userId: string) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserCreditCards(userId)
      .then(setCards)
      .finally(() => setLoading(false));
  }, [userId]);

  return {
    cards,
    loading,
    createCard: async (card: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>) => {
      const newCard = await createCreditCard(card);
      setCards(prev => [...prev, newCard]);
      return newCard;
    },
    updateCard: async (id: string, updates: Partial<CreditCard>) => {
      await updateCreditCard(id, updates);
      setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    },
    deleteCard: async (id: string) => {
      await deleteCreditCard(id);
      setCards(prev => prev.filter(c => c.id !== id));
    },
    // Faturas
    getInvoices: getCreditCardInvoices,
    upsertInvoice: upsertCreditCardInvoice,
  };
} 