"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile } from '@/lib/types/finance';
import { useUserProfile } from '@/hooks/useUserProfile';

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isOnboardingCompleted: boolean;
  refreshUser: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);
  
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    loadProfile,
  } = useUserProfile();

  const refreshUser = async () => {
    try {
      setUserLoading(true);
      setUserError(null);
      
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }
      
      setUser(data.user);
    } catch (err: any) {
      setUserError(err.message || 'Erro ao carregar usuário');
      console.error('Erro em UserContext.refreshUser:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const refreshProfile = async () => {
    await loadProfile();
  };

  // Carrega o usuário automaticamente
  useEffect(() => {
    refreshUser();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const isOnboardingCompleted = profile?.onboarding_completed ?? false;
  const loading = userLoading || profileLoading;
  const error = userError || profileError;

  const value: UserContextType = {
    user,
    profile,
    loading,
    error,
    isOnboardingCompleted,
    refreshUser,
    refreshProfile,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
} 