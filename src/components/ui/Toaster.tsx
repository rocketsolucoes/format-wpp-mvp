import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

/**
 * Tipos de toast disponíveis
 */
type ToastType = 'success' | 'error' | 'warning';

/**
 * Interface para definir um toast
 */
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  icon?: string;
}

/**
 * Interface do contexto do Toast
 */
interface ToastContextType {
  showToast: (message: string, type: ToastType, options?: { duration?: number; icon?: string }) => void;
}

/**
 * Criação do contexto
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Hook customizado para usar o toast
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * ToastProvider Component
 *
 * Provedor do contexto de toast que gerencia o estado global das notificações
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * Função para exibir um novo toast
   */
  const showToast = useCallback((message: string, type: ToastType, options?: { duration?: number; icon?: string }) => {
    const id = Math.random().toString(36).substring(7);
    const duration = options?.duration || 3000;
    const newToast: Toast = { id, message, type, duration, icon: options?.icon };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration);
  }, []);

  /**
   * Função para remover um toast específico
   */
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container de toasts - posicionado no canto superior direito */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * ToastItem Component
 *
 * Componente individual de cada notificação toast
 */
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  /**
   * Retorna o ícone apropriado baseado no tipo de toast
   */
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  /**
   * Retorna as classes CSS baseadas no tipo de toast
   */
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg animate-slide-in ${getStyles()}`}
      role="status"
      aria-live="polite"
    >
      {/* Ícone customizado ou padrão */}
      {toast.icon ? (
        <span className="text-lg">{toast.icon}</span>
      ) : (
        getIcon()
      )}

      {/* Mensagem */}
      <p className="flex-1 text-sm font-medium">{toast.message}</p>

      {/* Botão de fechar */}
      <button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Componente Toaster principal para ser usado no App
 */
export const Toaster: React.FC = () => {
  return null; // O ToastProvider já renderiza os toasts
};

/**
 * Funções auxiliares para uso direto (sem hook)
 */
let toastFunction: ((message: string, type: ToastType, options?: { duration?: number; icon?: string }) => void) | null = null;

export const setToastFunction = (fn: (message: string, type: ToastType, options?: { duration?: number; icon?: string }) => void) => {
  toastFunction = fn;
};

export const toast = {
  success: (message: string, options?: { duration?: number; icon?: string }) =>
    toastFunction?.(message, 'success', options),
  error: (message: string, options?: { duration?: number; icon?: string }) =>
    toastFunction?.(message, 'error', options),
  warning: (message: string, options?: { duration?: number; icon?: string }) =>
    toastFunction?.(message, 'warning', options),
};
