import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from './ui/Toaster';

/**
 * Props do componente OutputTextarea
 */
interface OutputTextareaProps {
  value: string;
  disabled?: boolean;
}

/**
 * OutputTextarea Component
 *
 * Área de texto de saída com funcionalidade de copiar.
 *
 * Funcionalidades:
 * - Exibição do texto formatado
 * - Botão de copiar com feedback visual
 * - Ícone muda de Copy para Check após copiar
 * - Notificação de sucesso ao copiar
 */
const OutputTextarea: React.FC<OutputTextareaProps> = ({ value, disabled = false }) => {
  // Estado para controlar o feedback visual após copiar
  const [copied, setCopied] = useState(false);

  /**
   * Função para copiar o texto formatado para a área de transferência
   */
  const handleCopy = async () => {
    // Verifica se há texto para copiar
    if (!value.trim()) {
      toast.error('Nenhum texto para copiar');
      return;
    }

    try {
      // Usa a API moderna de clipboard
      await navigator.clipboard.writeText(value);

      // Ativa o estado de "copiado"
      setCopied(true);

      // Mostra notificação de sucesso
      toast.success('Texto copiado para área de transferência!', { icon: '📋', duration: 2000 });

      // Reseta o ícone após 2 segundos
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      // Tratamento de erro caso a cópia falhe
      toast.error('Falha ao copiar texto');
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="relative">
      {/* Card com efeito glassmorphism */}
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header do card */}
        <div className="px-4 py-3 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-300">Saída Formatada</h3>

          {/* Botão de copiar */}
          <button
            onClick={handleCopy}
            disabled={!value.trim() || disabled}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copiar para área de transferência"
          >
            {/* Alterna entre ícone de Copy e Check */}
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>

        {/* Área de texto (somente leitura) */}
        <textarea
          value={value}
          readOnly
          placeholder="Seu texto formatado aparecerá aqui..."
          className={`w-full min-h-[400px] p-4 bg-transparent text-slate-100 placeholder-slate-600 resize-none focus:outline-none ${
            disabled ? 'opacity-50' : ''
          }`}
        />

        {/* Badge de status quando há texto */}
        {value.trim() && (
          <div className="px-4 py-2 bg-emerald-500/10 border-t border-emerald-500/20">
            <p className="text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-3 h-3" />
              Pronto para usar no WhatsApp
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputTextarea;
