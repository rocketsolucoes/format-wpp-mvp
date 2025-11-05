import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Check } from 'lucide-react';

/**
 * Props do componente Checkbox
 */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/**
 * Checkbox Component
 *
 * Checkbox estilizado com ícone de check customizado.
 * Suporta label integrado opcional.
 */
const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).substring(7)}`;

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={checkboxId}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded border-2 border-slate-700 bg-slate-900/50 transition-all peer-checked:border-emerald-500 peer-checked:bg-gradient-to-br peer-checked:from-emerald-500 peer-checked:to-cyan-500 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            <Check className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
          </label>
        </div>
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm text-slate-300 cursor-pointer select-none"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
