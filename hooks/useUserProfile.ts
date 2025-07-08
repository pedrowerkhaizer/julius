"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getUserProfile, updateUserProfile, createUserProfile } from '@/lib/supabaseClient';
import { UserProfile, UseUserProfileReturn } from '@/lib/types/finance';
import { toast } from 'sonner';

/**
 * Hook para gerenciar o perfil do usuário
 */
export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const userId = authData.user.id;
      let userProfile: UserProfile;
      
      try {
        userProfile = await getUserProfile(userId);
      } catch (err: any) {
        // Se não existe, cria um perfil básico
        userProfile = await createUserProfile(
          userId, 
          authData.user.email || '', 
          authData.user.user_metadata?.full_name || ''
        );
      }
      
      setProfile(userProfile);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar perfil';
      setError(errorMessage);
      console.error('Erro em useUserProfile.loadProfile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<UserProfile> => {
    if (!profile) {
      throw new Error('Perfil não carregado');
    }
    
    try {
      setError(null);
      const updatedProfile = await updateUserProfile(profile.user_id, data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [profile]);

  const createProfile = useCallback(async (data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      setError(null);
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        throw new Error('Usuário não autenticado');
      }
      
      const userId = authData.user.id;
      const newProfile = await createUserProfile(
        userId,
        data.nome || '',
        data.whatsapp || ''
      );
      
      setProfile(newProfile);
      return newProfile;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar perfil';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // Carrega o perfil automaticamente quando o hook é montado
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    loadProfile,
    updateProfile,
    createProfile,
  };
} 