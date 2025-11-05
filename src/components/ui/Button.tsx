import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Variantes de estilo do botão
 */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

/**
 * Props do componente Button
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Button Component
 *
 * Botão estilizado com múltiplas variantes e estado de carregamento.
 *
 * Variantes disponíveis:
 * - primary: Gradiente emerald-to-cyan (padrão)
 * - secondary: Fundo slate com borda
 * - ghost: Transparente com hover
 * - danger: Vermelho para ações destrutivas
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  /**
   * Retorna as classes CSS baseadas na variante
   */
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40';
      case 'secondary':
        return 'bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700';
      case 'ghost':
        return 'bg-transparent text-slate-300 hover:bg-slate-800/50';
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20';
      case 'outline':
        return 'bg-transparent text-slate-300 border border-slate-700 hover:bg-slate-800/50';
      default:
        return '';
    }
  };

  return (
    <button
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 ${
        fullWidth ? 'w-full' : ''
      } ${getVariantClasses()} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

export { Button };
export default Button;
