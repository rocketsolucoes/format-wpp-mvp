import React, { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-card border ${
            error ? 'border-destructive' : 'border-border'
          } rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-destructive/50' : 'focus:ring-primary/50'
          } focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
export { Input };
