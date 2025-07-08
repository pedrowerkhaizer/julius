import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RecurrenceException } from '@/lib/types/finance';
import { toast } from 'sonner';

export function useRecurrenceExceptions() {
  const [exceptions, setExceptions] = useState<RecurrenceException[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar exceções de recorrência do Supabase
  const loadExceptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('recurrence_exceptions')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      setExceptions(data || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar exceções');
      toast.error("Erro ao carregar exceções de recorrência");
    } finally {
      setLoading(false);
    }
  };

  // Adicionar exceção
  const addException = async (exceptionData: Omit<RecurrenceException, 'id' | 'created_at'>): Promise<RecurrenceException> => {
    const { data, error } = await supabase
      .from('recurrence_exceptions')
      .insert([exceptionData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    setExceptions(prev => [...prev, data]);
    return data;
  };

  // Atualizar exceção
  const updateException = async (id: string, updateData: Partial<RecurrenceException>): Promise<RecurrenceException> => {
    const { data, error } = await supabase
      .from('recurrence_exceptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    setExceptions(prev => prev.map(exception => 
      exception.id === id ? data : exception
    ));
    
    return data;
  };

  // Deletar exceção
  const deleteException = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('recurrence_exceptions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    setExceptions(prev => prev.filter(exception => exception.id !== id));
  };

  // Carregar exceções ao montar
  useEffect(() => {
    loadExceptions();
  }, []);

  return {
    exceptions,
    loading,
    error,
    loadExceptions,
    addException,
    updateException,
    deleteException
  };
} 