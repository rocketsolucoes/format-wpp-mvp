import React, { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * Props do ProtectedRoute
 */
interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute Component
 *
 * Componente de proteção de rota que verifica autenticação.
 *
 * Features:
 * - Verifica se o usuário está autenticado
 * - Redireciona para /auth se não autenticado
 * - Mostra loading spinner durante verificação
 * - Renderiza o conteúdo apenas se autenticado
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  /**
   * Redireciona para /auth se não autenticado
   */
  useEffect(() => {
    if (!loading && !user) {
      setLocation('/auth');
    }
  }, [user, loading, setLocation]);

  /**
   * Mostra loading spinner durante verificação
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  /**
   * Não renderiza nada se não autenticado (o redirect já foi feito)
   */
  if (!user) {
    return null;
  }

  /**
   * Renderiza o conteúdo protegido
   */
  return <>{children}</>;
};

export default ProtectedRoute;
