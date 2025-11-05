import React from 'react';

/**
 * Props do componente InputTextarea
 */
interface InputTextareaProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * InputTextarea Component
 *
 * Área de texto de entrada com contador de caracteres.
 *
 * Funcionalidades:
 * - Limite máximo de 5000 caracteres
 * - Contador visual que muda de cor conforme o limite
 * - Validação visual (vermelho quando inválido)
 * - Desabilitação durante processamento
 */
const InputTextarea: React.FC<InputTextareaProps> = ({ value, onChange, disabled = false }) => {
  const maxLength = 5000;
  const minLength = 10;

  // Calcula a porcentagem do limite usado
  const usagePercentage = (value.length / maxLength) * 100;

  // Define a cor do contador baseado no uso
  const getCounterColor = () => {
    if (value.length > maxLength) return 'text-red-500';
    if (usagePercentage > 90) return 'text-orange-500';
    if (usagePercentage > 70) return 'text-yellow-500';
    return 'text-slate-500';
  };

  // Verifica se o input é válido
  const isValid = value.trim().length >= minLength && value.length <= maxLength;
  const showValidation = value.trim().length > 0;

  return (
    <div className="relative">
      {/* Card com efeito glassmorphism */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header do card */}
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-300">Input Text</h3>

          {/* Contador de caracteres */}
          <span className={`text-sm font-mono ${getCounterColor()}`}>
            {value.length} / {maxLength}
          </span>
        </div>

        {/* Área de texto */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Paste your WhatsApp message here... (minimum 10 characters)"
          className={`w-full min-h-[400px] p-4 bg-transparent text-slate-100 placeholder-slate-600 resize-none focus:outline-none ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            showValidation && !isValid ? 'text-red-400' : ''
          }`}
          maxLength={maxLength}
        />

        {/* Mensagem de validação */}
        {showValidation && !isValid && (
          <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
            <p className="text-xs text-red-400">
              {value.trim().length < minLength
                ? `Please enter at least ${minLength} characters (${minLength - value.trim().length} more needed)`
                : `Maximum ${maxLength} characters exceeded by ${value.length - maxLength}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputTextarea;
