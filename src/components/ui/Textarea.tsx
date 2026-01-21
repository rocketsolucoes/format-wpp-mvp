import React, { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={`w-full px-4 py-3 bg-muted/50 backdrop-blur-sm border ${
            error ? 'border-red-500/50' : 'border-border'
          } rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 ${
            error ? 'focus:ring-red-500/50' : 'focus:ring-emerald-500/50'
          } focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-y ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
export { Textarea };
