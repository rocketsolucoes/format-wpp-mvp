import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80';
      case 'ghost':
        return 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground';
      case 'danger':
        return 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20';
      case 'outline':
        return 'bg-transparent text-foreground border border-input hover:bg-accent hover:text-accent-foreground';
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
