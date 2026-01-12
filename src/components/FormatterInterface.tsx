import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Copy, Lock } from 'lucide-react';
import InputTextarea from './InputTextarea';
import OutputTextarea from './OutputTextarea';
import { toast } from './ui/Toaster';
import { Progress } from './ui/Progress';
import { formatText, FormatterError } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { savePendingText } from '../utils/textPersistence';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/Dialog';

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
  const [showSignupModal, setShowSignupModal] = useState(false);
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
    if (length <= 4000) return 'text-emerald-500';
    if (length <= 4900) return 'text-amber-500';
    return 'text-destructive';
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

  const handleCopyClick = () => {
    // Se não estiver logado, mostra modal
    if (!user && outputText) {
      // Salvar textos para restaurar depois
      localStorage.setItem('pendingFormattedText', outputText);
      localStorage.setItem('pendingInputText', inputText);
      setShowSignupModal(true);
      return;
    }

    // Se estiver logado, copia normalmente
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      toast.success('Texto copiado! ✨', { duration: 2000 });
    }
  };

  const handleSignupRedirect = () => {
    setShowSignupModal(false);
    setLocation('/auth?tab=signup&redirect=/format');
  };

  const handleFormat = async () => {
    if (!isInputValid()) {
      toast.error(validationError || 'Por favor, insira um texto válido');
      return;
    }

    // Se não estiver logado, formata mas não usa API real
    if (!user) {
      setIsFormatting(true);
      setProgress(0);

      // Simula formatação com delay
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);

      // Simula delay de 1.5s
      setTimeout(() => {
        clearInterval(progressInterval);
        setProgress(100);
        
        // Formatação básica simulada
        const simulatedFormatted = inputText
          .split('\n')
          .map(line => {
            if (line.trim().length > 0) {
              // Adiciona negrito em palavras-chave comuns
              return line
                .replace(/\b(importante|atenção|urgente|lembrete|aviso)\b/gi, '*$1*')
                .replace(/\b(horário|data|local|endereço|reunião)\b/gi, '*$1*')
                .replace(/\b(obrigatório|necessário|essencial)\b/gi, '*$1*');
            }
            return line;
          })
          .join('\n');
        
        setOutputText(simulatedFormatted);
        setIsFormatting(false);
        setProgress(0);
        
        toast.success('Texto formatado! 🎉 Clique em Copiar para usar.', { duration: 3000 });
      }, 1500);

      return;
    }

    // Fluxo normal para usuários logados
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
    <>
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
                  <span className="text-[10px] text-destructive font-medium">{validationError}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <OutputTextarea
                value={outputText}
                disabled={isFormatting}
              />
              
              {/* Botão de Copiar - aparece quando tem texto formatado */}
              {outputText && !isFormatting && (
                <div className="flex justify-center lg:justify-end">
                  <button
                    onClick={handleCopyClick}
                    className="w-full lg:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {!user ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Copiar Texto
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar Texto
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {/* Botão de Formatar - aparece quando não tem texto formatado */}
              {!outputText && (
                <div className="flex justify-center lg:justify-end">
                  {isFormatting ? (
                    <button
                      onClick={handleCancel}
                      className="w-full lg:w-auto px-6 py-2.5 bg-secondary hover:bg-secondary/80 rounded-lg font-semibold text-secondary-foreground text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-border"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </button>
                  ) : (
                    <button
                      onClick={handleFormat}
                      disabled={!isInputValid() || isFormatting}
                      className="w-full lg:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Estilizar Mensagem
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {isFormatting && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="animate-pulse">Processando</span>
                </span>
                <span>{user ? 'IA trabalhando...' : 'Preparando preview...'}</span>
              </div>
              <Progress value={progress} max={100} className="h-1" />
            </div>
          )}
        </div>
      </section>

      {/* Modal de Cadastro */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Lock className="w-12 h-12 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              🎉 Gostou do Resultado?
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed pt-2">
              Cadastre-se <strong className="text-foreground">GRÁTIS</strong> para copiar esta mensagem e ganhar <strong className="text-primary">30 créditos/mês</strong> para formatar quantas mensagens quiser!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-4">
            <button
              onClick={handleSignupRedirect}
              className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Cadastrar e Copiar Grátis
            </button>
            
            <button
              onClick={() => setShowSignupModal(false)}
              className="w-full px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar explorando
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              ✓ Sem cartão de crédito • ✓ 30 créditos grátis • ✓ Cancele quando quiser
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormatterInterface;
