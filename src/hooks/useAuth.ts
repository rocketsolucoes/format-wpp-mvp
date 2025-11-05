import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * useAuth Hook
 *
 * Hook customizado para acessar o contexto de autenticação.
 * Fornece acesso ao estado do usuário e funções de autenticação.
 *
 * @throws Error se usado fora do AuthProvider
 * @returns Objeto com estado e funções de autenticação
 *
 * @example
 * const { user, signIn, signOut, loading } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
