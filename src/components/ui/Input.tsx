import React, { InputHTMLAttributes, forwardRef } from 'react';

/**
 * Props do componente Input
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * Input Component
 *
 * Campo de entrada de texto estilizado consistente com o tema da aplicação.
 * Suporta todos os atributos nativos do input HTML.
 *
 * Features:
 * - Estados de focus, hover e disabled
 * - Mensagem de erro opcional
 * - Integração com React Hook Form via forwardRef
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-slate-900/50 backdrop-blur-sm border ${
            error ? 'border-red-500/50' : 'border-slate-800'
          } rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500/50' : 'focus:ring-emerald-500/50'
          } focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
export { Input };
