import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';
import InputTextarea from './InputTextarea';
import OutputTextarea from './OutputTextarea';
import { toast } from './ui/Toaster';
import { Progress } from './ui/Progress';
import { Alert, AlertDescription } from './ui/Alert';
import { formatText, FormatterError } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { savePendingText } from '../utils/textPersistence';

interface FormatterInterfaceProps {
  onNoCredits?: () => void;
  onFormatSuccess?: (creditsRemaining: number) => void;
}

const FormatterInterface: React.FC<FormatterInterfaceProps> = ({
  onNoCredits,
  onFormatSuccess,
}) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (inputText.trim().length === 0) {
      setValidationError(null);
    } else if (inputText.trim().length < 10) {
      setValidationError('O texto deve ter pelo menos 10 caracteres');
    } else if (inputText.length > 5000) {
      setValidationError('O texto deve ter menos de 5000 caracteres');
    } else {
      setValidationError(null);
    }
  }, [inputText]);

  const getCharCountColor = () => {
    const length = inputText.length;
    if (length <= 4000) return 'text-emerald-400';
    if (length <= 4900) return 'text-yellow-400';
    return 'text-red-400';
  };

  const isInputValid = (): boolean => {
    const trimmedText = inputText.trim();
    return trimmedText.length >= 10 && trimmedText.length <= 5000;
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsFormatting(false);
    setProgress(0);
    toast.warning('Formatação cancelada');
  };

  const handleFormat = async () => {
    if (!isInputValid()) {
      toast.error(validationError || 'Por favor, insira um texto válido');
      return;
    }

    if (!user) {
      if (savePendingText(inputText)) {
        toast.success('Redirecionando para login...');
      }
      setLocation('/auth');
      return;
    }

    setIsFormatting(true);
    setProgress(0);
    abortControllerRef.current = new AbortController();

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const result = await formatText(inputText.trim());

      setProgress(100);
      setOutputText(result.formatted_text);

      await refreshUser();

      if (onFormatSuccess) {
        onFormatSuccess(result.credits_remaining);
      }

      if (result.credits_remaining === 0) {
        toast.warning('Você usou todos os seus créditos!', { icon: '⚠️', duration: 4000 });
      } else if (result.credits_remaining > 0 && result.credits_remaining <= 5) {
        toast.warning(`Apenas ${result.credits_remaining} créditos restantes`, { icon: '⚠️', duration: 3000 });
      } else {
        toast.success('Texto formatado com sucesso! ✨', { icon: '✅', duration: 3000 });
      }
    } catch (error) {
      setProgress(0);

      if (error instanceof FormatterError) {
        switch (error.code) {
          case 'AUTH_REQUIRED':
            toast.error('Por favor, faça login novamente', { icon: '🔒', duration: 4000 });
            setLocation('/auth');
            break;
          case 'NO_CREDITS':
            toast.error('Você esgotou seus créditos! Faça upgrade para continuar.', { icon: '🚫', duration: 5000 });
            if (onNoCredits) {
              onNoCredits();
            }
            break;
          case 'VALIDATION_ERROR':
            toast.error(error.message, { icon: '⚠️', duration: 4000 });
            break;
          case 'NETWORK_ERROR':
            toast.error('Erro de rede. Por favor, verifique sua conexão.', { icon: '📡', duration: 4000 });
            break;
          case 'SERVER_ERROR':
          default:
            toast.error('Ops! Algo deu errado. Tente novamente.', { icon: '⚠️', duration: 4000 });
            break;
        }
      } else {
        toast.error('Ocorreu um erro inesperado', { icon: '⚠️', duration: 4000 });
      }

      console.error('Formatting error:', error);
    } finally {
      clearInterval(progressInterval);
      setIsFormatting(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  return (
    <section id="formatter" className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-4 items-start">
          <div className="space-y-2">
            <InputTextarea
              value={inputText}
              onChange={setInputText}
              disabled={isFormatting}
            />
            <div className="flex items-center justify-between px-1">
              <span className={`text-[10px] font-medium uppercase tracking-wider ${getCharCountColor()}`}>
                {inputText.length} / 5000 caracteres
              </span>
              {validationError && (
                <span className="text-[10px] text-red-400 font-medium">{validationError}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <OutputTextarea
              value={outputText}
              disabled={isFormatting}
            />
            <div className="flex justify-center lg:justify-end">
              {isFormatting ? (
                <button
                  onClick={handleCancel}
                  className="w-full lg:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-white text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-slate-700"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              ) : (
                <button
                  onClick={handleFormat}
                  disabled={!isInputValid() || isFormatting}
                  className="w-full lg:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Estilizar Mensagem
                </button>
              )}
            </div>
          </div>
        </div>

        {isFormatting && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <span className="animate-pulse">Processando</span>
              </span>
              <span>IA trabalhando...</span>
            </div>
            <Progress value={progress} max={100} className="h-1" />
          </div>
        )}
      </div>
    </section>
  );
};

export default FormatterInterface;
