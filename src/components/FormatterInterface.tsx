import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Copy, Lock } from 'lucide-react';
import InputTextarea from './InputTextarea';
import { WhatsAppPreview } from './WhatsAppPreview';
import { toast } from './ui/Toaster';
import { Progress } from './ui/Progress';
import { formatText, FormatterError } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { savePendingText, saveFormattedPreview } from '../utils/textPersistence';
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
    } else if (!user && inputText.length > 500) {
      setValidationError('Preview limitado a 500 caracteres. Cadastre-se para mais!');
    } else if (inputText.length > 5000) {
      setValidationError('O texto deve ter menos de 5000 caracteres');
    } else {
      setValidationError(null);
    }
  }, [inputText, user]);

  const getCharCountColor = () => {
    const length = inputText.length;
    const limit = user ? 5000 : 500;
    
    if (length <= limit * 0.8) return 'text-emerald-500';
    if (length <= limit * 0.98) return 'text-amber-500';
    return 'text-destructive';
  };

  const isInputValid = (): boolean => {
    const trimmedText = inputText.trim();
    const maxLength = user ? 5000 : 500;
    return trimmedText.length >= 10 && trimmedText.length <= maxLength;
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
      // Salvar textos usando a função de persistência
      saveFormattedPreview(inputText, outputText);
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

  const formatTextPreview = async (text: string): Promise<string> => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const apiUrl = `${supabaseUrl}/functions/v1/format-text-preview`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw new Error(errorData.error || 'Limite de tentativas excedido. Tente novamente em alguns minutos.');
      }
      
      if (response.status === 400 && errorData.code === 'PREVIEW_LIMIT_EXCEEDED') {
        throw new Error(errorData.error);
      }
      
      throw new Error(errorData.error || 'Falha ao formatar texto');
    }

    const data = await response.json();
    return data.formatted_text;
  };

  const handleFormat = async () => {
    if (!isInputValid()) {
      toast.error(validationError || 'Por favor, insira um texto válido');
      return;
    }

    setIsFormatting(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      let formattedText: string;

      // Se não estiver logado, usa API de preview
      if (!user) {
        formattedText = await formatTextPreview(inputText.trim());
        setProgress(100);
        setOutputText(formattedText);
        toast.success('Texto formatado pela IA! 🎉 Veja o resultado abaixo.', { duration: 3000 });
      } else {
        // Fluxo normal para usuários logados
        abortControllerRef.current = new AbortController();
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
      } else if (error instanceof Error) {
        toast.error(error.message, { icon: '⚠️', duration: 4000 });
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

  const maxChars = user ? 5000 : 500;

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
                  {inputText.length} / {maxChars} caracteres
                  {!user && <span className="ml-2 text-muted-foreground">(Preview limitado)</span>}
                </span>
                {validationError && (
                  <span className="text-[10px] text-destructive font-medium">{validationError}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {/* Preview do WhatsApp quando tem texto formatado */}
              {outputText ? (
                <WhatsAppPreview text={outputText} isLoading={isFormatting} />
              ) : (
                <div className="bg-card border border-border rounded-lg shadow-lg min-h-[400px] flex items-center justify-center">
                  <p className="text-muted-foreground text-sm text-center px-4">
                    {!user ? (
                      <>
                        Seu texto formatado pela <strong>IA real</strong> aparecerá aqui<br />
                        no estilo WhatsApp...
                      </>
                    ) : (
                      'Seu texto formatado aparecerá aqui no estilo WhatsApp...'
                    )}
                  </p>
                </div>
              )}
              
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
                      {!user ? 'Testar com IA Real' : 'Estilizar Mensagem'}
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
                <span>IA trabalhando...</span>
              </div>
              <Progress value={progress} max={100} className="h-1" />
            </div>
          )}
        </div>
      </section>

      {/* Modal de Cadastro - Trial como Recompensa */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            <DialogTitle className="text-center text-2xl font-bold">
              Desbloqueie sua mensagem e ganhe<br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                7 Dias de Pro de Presente! 🎁
              </span>
            </DialogTitle>
            <DialogDescription className="text-center text-base leading-relaxed pt-3 text-foreground/80">
              Crie sua conta <strong className="text-foreground">GRÁTIS</strong> agora e aproveite todos os recursos premium por 7 dias!
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            {/* Benefício 1 */}
            <div className="flex flex-col items-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">⚡</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground text-center">Créditos Ilimitados</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">Formate sem limites</p>
            </div>

            {/* Benefício 2 */}
            <div className="flex flex-col items-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">🔥</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground text-center">Estilos Pro</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">Sales & Official</p>
            </div>

            {/* Benefício 3 */}
            <div className="flex flex-col items-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">📝</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground text-center">Histórico Completo</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">Acesso ilimitado</p>
            </div>

            {/* Benefício 4 */}
            <div className="flex flex-col items-center p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="font-semibold text-sm text-foreground text-center">Análises Avançadas</h4>
              <p className="text-xs text-muted-foreground text-center mt-1">Insights e gráficos</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSignupRedirect}
              className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Criar conta e ativar meus 7 dias grátis
            </button>

            <button
              onClick={() => setShowSignupModal(false)}
              className="w-full px-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar explorando
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              ✓ Sem cartão de crédito • ✓ Trial Pro de 7 dias • ✓ Sem compromisso
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormatterInterface;
