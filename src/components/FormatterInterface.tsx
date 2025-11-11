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
    <section id="formatter" className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-12 text-slate-100">
        Formate Sua Mensagem
      </h2>

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <InputTextarea
            value={inputText}
            onChange={setInputText}
            disabled={isFormatting}
          />

          <OutputTextarea
            value={outputText}
            disabled={isFormatting}
          />
        </div>

        <div className="mt-6 space-y-4">
          {validationError && (
            <Alert variant="danger" className="max-w-6xl mx-auto">
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${getCharCountColor()}`}>
                {inputText.length} / 5000 caracteres
              </span>
            </div>
          </div>

          {isFormatting && (
            <div className="max-w-6xl mx-auto space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">Formatando</span>
                  <span className="flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                  </span>
                </span>
                <span>Tempo estimado: 2-5 segundos</span>
              </div>
              <Progress value={progress} max={100} />
            </div>
          )}

          <div className="flex justify-center gap-3">
            {isFormatting ? (
              <button
                onClick={handleCancel}
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-lg font-semibold text-white transition-all duration-300 flex items-center gap-2 border border-slate-700"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
            ) : (
              <button
                onClick={handleFormat}
                disabled={!isInputValid() || isFormatting}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Formatar com IA
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FormatterInterface;
