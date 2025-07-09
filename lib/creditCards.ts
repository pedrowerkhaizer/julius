import { supabase } from './supabaseClient';
import { CreditCard, CreditCardInvoice } from './types/finance';

// Cartões de Crédito
export async function getUserCreditCards(userId: string): Promise<CreditCard[]> {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

export async function createCreditCard(card: Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert(card)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCreditCard(id: string, updates: Partial<CreditCard>): Promise<CreditCard> {
  const { data, error } = await supabase
    .from('credit_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCreditCard(id: string): Promise<void> {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// Faturas de Cartão
export async function getCreditCardInvoices(cardId: string): Promise<CreditCardInvoice[]> {
  const { data, error } = await supabase
    .from('credit_card_invoices')
    .select('*')
    .eq('credit_card_id', cardId);
  if (error) throw error;
  return data || [];
}

export async function upsertCreditCardInvoice(invoice: Omit<CreditCardInvoice, 'id' | 'created_at' | 'updated_at'>): Promise<CreditCardInvoice> {
  const { data, error } = await supabase
    .from('credit_card_invoices')
    .upsert([invoice], { onConflict: 'credit_card_id,month' })
    .select()
    .single();
  if (error) throw error;
  return data;
} 