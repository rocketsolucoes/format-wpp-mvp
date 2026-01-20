import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toaster';
import { PRICING } from '../constants/pricing';

/**
 * Interface do usuário extendida com dados do perfil
 */
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio?: string | null;
  plan: 'free' | 'pro' | 'enterprise';
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: string | null;
  credits_remaining: number;
  created_at: string;
  preferences?: any;
  // Trial fields
  trial_status?: 'active' | 'expired' | 'converted' | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  trial_welcome_shown?: boolean;
}

/**
 * Interface do contexto de autenticação
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, fullName: string, whatsapp?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
        bio: data.bio,
        plan: data.subscription_tier || data.plan,
        subscription_tier: data.subscription_tier,
        subscription_status: data.subscription_status,
        credits_remaining: data.credits_remaining,
        created_at: data.created_at,
        preferences: data.preferences,
        trial_status: data.trial_status,
        trial_start_date: data.trial_start_date,
        trial_end_date: data.trial_end_date,
        trial_welcome_shown: data.trial_welcome_shown,
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
  const signUp = async (email: string, password: string, fullName: string, whatsapp?: string) => {
    console.log('🔵 [SignUp] Iniciando processo de cadastro...', { email, fullName, whatsapp });

    try {
      setError(null);
      setLoading(true);

      console.log('🔵 [SignUp] Criando usuário no Supabase Auth...');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            whatsapp: whatsapp || null,  // Pass whatsapp in metadata
          },
        },
      });

      if (signUpError) {
        console.error('❌ [SignUp] Erro ao criar usuário:', signUpError);

        let errorMessage = 'Erro ao criar conta';
        if (signUpError.message.includes('already registered')) {
          errorMessage = 'Este email já está cadastrado';
        } else if (signUpError.message.includes('Password should be')) {
          errorMessage = 'A senha deve ter pelo menos 6 caracteres';
        } else if (signUpError.message) {
          errorMessage = signUpError.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.user) {
        console.error('❌ [SignUp] Nenhum usuário retornado após signup');
        const noUserError = 'Erro ao criar conta: usuário não foi criado';
        setError(noUserError);
        toast.error(noUserError);
        throw new Error(noUserError);
      }

      console.log('✅ [SignUp] Usuário criado com sucesso:', data.user.id);
      console.log('🔵 [SignUp] Trigger handle_new_user() criou o perfil automaticamente');

      // Wait a moment for trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('🔵 [SignUp] Buscando perfil criado pelo trigger...');

      // Fetch the profile created by the trigger
      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        console.error('❌ [SignUp] Erro ao buscar perfil após criação');
        const fetchProfileError = 'Erro ao carregar perfil do usuário';
        setError(fetchProfileError);
        toast.error(fetchProfileError);
        throw new Error(fetchProfileError);
      }

      console.log('✅ [SignUp] Perfil carregado com sucesso:', profile);
      setUser(profile);
      toast.success('Conta criada com sucesso! ✨', { icon: '✅', duration: 3000 });
      console.log('✅ [SignUp] Processo de cadastro concluído com sucesso!');
    } catch (err: any) {
      console.error('❌ [SignUp] Erro no processo de cadastro:', err);
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função de login
   */
  const signIn = async (email: string, password: string) => {
    console.log('🔵 [SignIn] Iniciando processo de login...', { email });

    try {
      setError(null);
      setLoading(true);

      console.log('🔵 [SignIn] Autenticando usuário...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ [SignIn] Erro na autenticação:', signInError);

        let errorMessage = 'Erro ao fazer login';
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou senha incorretos';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Por favor, confirme seu email antes de fazer login';
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = 'Muitas tentativas. Por favor, aguarde alguns minutos';
        } else if (signInError.message) {
          errorMessage = signInError.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.user) {
        console.error('❌ [SignIn] Nenhum usuário retornado após login');
        const noUserError = 'Erro ao fazer login: sessão não foi criada';
        setError(noUserError);
        toast.error(noUserError);
        throw new Error(noUserError);
      }

      console.log('✅ [SignIn] Usuário autenticado com sucesso:', data.user.id);
      console.log('🔵 [SignIn] Carregando perfil do usuário...');

      const profile = await fetchUserProfile(data.user.id);
      if (!profile) {
        console.error('❌ [SignIn] Erro ao carregar perfil do usuário');
        const profileError = 'Erro ao carregar perfil do usuário';
        setError(profileError);
        toast.error(profileError);
        throw new Error(profileError);
      }

      console.log('✅ [SignIn] Perfil carregado com sucesso:', profile);
      setUser(profile);
      const userName = profile.full_name?.split(' ')[0] || 'usuário';
      toast.success(`Bem-vindo de volta, ${userName}!`, { icon: '✅', duration: 3000 });
      console.log('✅ [SignIn] Processo de login concluído com sucesso!');
    } catch (err: any) {
      console.error('❌ [SignIn] Erro no processo de login:', err);
      setLoading(false);
      throw err;
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

      toast.success('Até logo! Volte sempre.', { icon: '👋', duration: 2000 });
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
    console.log('🔵 [ResetPassword] Iniciando redefinição de senha...', { email });

    try {
      setError(null);
      setLoading(true);

      console.log('🔵 [ResetPassword] Enviando email de redefinição...');
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (resetError) {
        console.error('❌ [ResetPassword] Erro ao enviar email:', resetError);
        setError(resetError.message);
        toast.error(resetError.message);
        throw resetError;
      }

      console.log('✅ [ResetPassword] Email enviado com sucesso!');
      toast.success('Email enviado! Verifique sua caixa de entrada.', { icon: '📧', duration: 4000 });
    } catch (err) {
      console.error('❌ [ResetPassword] Erro no processo:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Função para atualizar senha do usuário (usado após reset de senha)
   */
  const updatePassword = async (newPassword: string) => {
    console.log('🔵 [UpdatePassword] Iniciando atualização de senha...');

    try {
      setError(null);
      setLoading(true);

      console.log('🔵 [UpdatePassword] Atualizando senha no Supabase...');
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error('❌ [UpdatePassword] Erro ao atualizar senha:', updateError);
        setError(updateError.message);
        toast.error(updateError.message);
        throw updateError;
      }

      console.log('✅ [UpdatePassword] Senha atualizada com sucesso!');
      toast.success('Senha atualizada com sucesso!', { icon: '✅', duration: 3000 });

      console.log('🔵 [UpdatePassword] Fazendo logout para segurança...');
      // Fazer logout após atualizar senha (para forçar novo login)
      await signOut();
    } catch (err) {
      console.error('❌ [UpdatePassword] Erro no processo:', err);
      setLoading(false);
      throw err;
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
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
