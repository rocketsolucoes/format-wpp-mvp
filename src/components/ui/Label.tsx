import React, { LabelHTMLAttributes } from 'react';

/**
 * Props do componente Label
 */
export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/**
 * Label Component
 *
 * Rótulo de formulário estilizado.
 * Usado em conjunto com Input para criar campos de formulário acessíveis.
 */
const Label: React.FC<LabelProps> = ({ children, required, className = '', ...props }) => {
  return (
    <label
      className={`block text-sm font-medium text-foreground mb-2 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
};

export { Label };
export default Label;
