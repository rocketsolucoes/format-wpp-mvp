import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toaster';

/**
 * Interface do usuário extendida com dados do perfil
 */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: string | null;
  credits_remaining: number;
  created_at: string;
}

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

/**
 * Criação do contexto de autenticação
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props do AuthProvider
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 *
 * Provedor do contexto de autenticação que gerencia:
 * - Estado do usuário autenticado
 * - Funções de autenticação (login, signup, logout)
 * - Atualização de perfil
 * - Persistência de sessão
 * - Auto-refresh de token
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Busca os dados completos do perfil do usuário
   */
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        avatar_url: data.avatar_url,
        plan: data.subscription_tier || data.plan,
        subscription_tier: data.subscription_tier,
        subscription_status: data.subscription_status,
        credits_remaining: data.credits_remaining,
        created_at: data.created_at,
      };
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return null;
    }
  };

  /**
   * Atualiza o estado do usuário baseado na sessão
   */
  const handleSessionChange = async (session: Session | null) => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      setUser(profile);
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  /**
   * Função de registro (signup)
   */
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        toast.error(signUpError.message);
        throw signUpError;
      }

      if (data.user) {
        // Cria o perfil do usuário na tabela profiles
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          avatar_url: null,
          plan: 'free',
          subscription_tier: 'free',
          subscription_status: null,
          credits_remaining: 30,
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        toast.success('Account created successfully! Please check your email.');
      }
    } catch (err) {
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de login
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        toast.error(signInError.message);
        throw signInError;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUser(profile);
        toast.success('Welcome back!');
      }
    } catch (err) {
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de login com Google
   */
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signInError) {
        setError(signInError.message);
        toast.error(signInError.message);
        throw signInError;
      }
    } catch (err) {
      console.error('Google sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de logout
   */
  const signOut = async () => {
    try {
      setError(null);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        console.error('Sign out error:', signOutError);
      }

      setUser(null);
      localStorage.clear();
      sessionStorage.clear();

      toast.success('Signed out successfully');
    } catch (err) {
      console.error('Sign out error:', err);
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  /**
   * Função para resetar senha
   */
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      setLoading(true);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (resetError) {
        setError(resetError.message);
        toast.error(resetError.message);
        throw resetError;
      }

      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função para atualizar perfil do usuário
   */
  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    try {
      setError(null);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        toast.error(updateError.message);
        throw updateError;
      }

      // Atualiza o estado local
      setUser({ ...user, ...data });
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Update profile error:', err);
    }
  };

  /**
   * Verifica a sessão ao montar o componente
   */
  useEffect(() => {
    // Busca a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
    });

    // Escuta mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSessionChange(session);
    });

    // Cleanup: remove o listener ao desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    const profile = await fetchUserProfile(user.id);
    if (profile) {
      setUser(profile);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
