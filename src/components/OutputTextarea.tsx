import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from './ui/Toaster';

interface OutputTextareaProps {
  value: string;
  disabled?: boolean;
}

const OutputTextarea: React.FC<OutputTextareaProps> = ({ value, disabled = false }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value.trim()) {
      toast.error('Nenhum texto para copiar');
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Texto copiado para área de transferência!', { icon: '📋', duration: 2000 });
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Falha ao copiar texto');
      console.error('Copy error:', error);
    }
  };

  return (
    <div className="relative">
      <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-muted/30">
          <h3 className="text-sm font-semibold">Saída Formatada</h3>

          <button
            onClick={handleCopy}
            disabled={!value.trim() || disabled}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copiar para área de transferência"
          >
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </div>

        <textarea
          value={value}
          readOnly
          placeholder="Seu texto formatado aparecerá aqui..."
          className={`w-full min-h-[400px] p-4 bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none ${
            disabled ? 'opacity-50' : ''
          }`}
        />

        {value.trim() && (
          <div className="px-4 py-2 bg-primary/10 border-t border-primary/20">
            <p className="text-xs text-primary flex items-center gap-2">
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
