import React from 'react';

interface InputTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InputTextarea: React.FC<InputTextareaProps> = ({ value, onChange, disabled = false }) => {
  const maxLength = 5000;
  const minLength = 10;

  const usagePercentage = (value.length / maxLength) * 100;

  const getCounterColor = () => {
    if (value.length > maxLength) return 'text-destructive';
    if (usagePercentage > 90) return 'text-orange-500';
    if (usagePercentage > 70) return 'text-amber-500';
    return 'text-muted-foreground';
  };

  const isValid = value.trim().length >= minLength && value.length <= maxLength;
  const showValidation = value.trim().length > 0;

  return (
    <div className="relative">
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="text-sm font-semibold">Texto de Entrada</h3>

          <span className={`text-sm font-mono ${getCounterColor()}`}>
            {value.length} / {maxLength}
          </span>
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Cole sua mensagem do WhatsApp aqui... (mínimo 10 caracteres)"
          className={`w-full min-h-[400px] p-4 bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            showValidation && !isValid ? 'text-destructive' : ''
          }`}
          maxLength={maxLength}
        />

        {showValidation && !isValid && (
          <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
            <p className="text-xs text-destructive">
              {value.trim().length < minLength
                ? `Por favor, insira pelo menos ${minLength} caracteres (faltam ${minLength - value.trim().length})`
                : `Máximo de ${maxLength} caracteres excedido em ${value.length - maxLength}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputTextarea;
