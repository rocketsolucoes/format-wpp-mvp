import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Copy, RefreshCw, Eraser, MessageCircle } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import { formatText, FormatterError, UserFormattingProfile } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../hooks/useAnalytics';
import { useLocation } from 'wouter';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/ui/Button';
import { WhatsAppPreview } from '../components/WhatsAppPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../components/ui/Dialog';
import { getPendingText, clearPendingText, getFormattedPreview, clearFormattedPreview } from '../utils/textPersistence';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

export default function Format() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [previewText, setPreviewText] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'credits' | 'pro-style'>('credits');
  const [whatsappFallbackOpen, setWhatsappFallbackOpen] = useState(false);
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  // NOVO SISTEMA: Modo de intenção (não salvo no localStorage, reset a cada visita)
  const [intentMode, setIntentMode] = useState<'general' | 'sales' | 'notice'>('general');

  // NOVO SISTEMA: Perfil de formatação (salvo no localStorage)
  const [profile, setProfile] = useLocalStorageState<UserFormattingProfile>('user-formatting-profile', {
    style_level: 'balanced',
    emoji_mode: 'smart',
    layout_mode: 'blocks',
    highlight_mode: 'essential_only',
  });

  // Rastrear mudança de modo de intenção
  useEffect(() => {
    if (intentMode) {
      trackEvent('intent_mode_change', {
        mode: intentMode,
        plan: user?.plan || 'guest',
        event_category: 'engagement',
        event_label: 'intent_mode_changed'
      });
    }
  }, [intentMode, user]);

  useEffect(() => {
    const pendingText = getPendingText();
    const formattedPreview = getFormattedPreview();
    const reformatText = localStorage.getItem('reformat_text');

    // Prioridade 1: Preview formatado da landing page
    if (formattedPreview) {
      setInputText(formattedPreview.inputText);
      setOutputText(formattedPreview.formattedText);
      setPreviewText(formattedPreview.formattedText);
      clearFormattedPreview();
      toast.success('🎉 Seu texto já está formatado! Agora você pode copiar e usar todos os recursos.', { duration: 5000 });
    }
    // Prioridade 2: Texto pendente (fluxo antigo)
    else if (pendingText) {
      setInputText(pendingText);
      clearPendingText();
      toast.success('Seu texto foi restaurado! ✨ Clique em Formatar para continuar.');
    }
    // Prioridade 3: Reformatar do histórico
    else if (reformatText) {
      setInputText(reformatText);
      localStorage.removeItem('reformat_text');
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPreviewText(outputText || inputText);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputText, outputText]);

  const charCount = inputText.length;
  const charCountColor = charCount > 4500 ? 'text-red-400' : charCount > 4000 ? 'text-yellow-400' : 'text-muted-foreground';
  const isInputValid = inputText.trim().length >= 10 && inputText.length <= 5000;

  const handleFormat = async () => {
    if (!isInputValid) {
      toast.error('Por favor, insira um texto entre 10 e 5000 caracteres');
      return;
    }

    if (!user) {
      toast.error('Por favor, faça login para formatar texto');
      setLocation('/auth');
      return;
    }

    if (user.plan === 'free' && user.credits_remaining <= 0) {
      trackEvent('upgrade_prompt_view', {
        reason: 'no_credits',
        plan: user.plan,
        event_category: 'conversion',
        event_label: 'credits_exhausted'
      });
      setUpgradeReason('credits');
      setUpgradeModalOpen(true);
      return;
    }

    // NOVO SISTEMA: Validar acesso a modos PRO
    const proIntentModes = ['sales', 'notice'];
    if (user.plan === 'free' && proIntentModes.includes(intentMode)) {
      trackEvent('upgrade_prompt_view', {
        reason: 'pro_mode',
        mode: intentMode,
        plan: user.plan,
        event_category: 'conversion',
        event_label: 'pro_mode_required'
      });
      setUpgradeReason('pro-style');
      setUpgradeModalOpen(true);
      return;
    }

    // Rastrear início da formatação
    trackEvent('format_start', {
      intent_mode: intentMode,
      profile: profile,
      plan: user.plan,
      text_length: inputText.trim().length,
      credits_remaining: user.credits_remaining,
      event_category: 'engagement',
      event_label: 'format_text'
    });

    setIsFormatting(true);

    console.log('Format.tsx - intentMode:', intentMode);
    console.log('Format.tsx - userProfile:', profile);

    try {
      // NOVO SISTEMA: Enviar intentMode e userProfile
      const result = await formatText(inputText.trim(), undefined, intentMode, profile);
      setOutputText(result.formatted_text);
      await refreshUser();

      // Rastrear sucesso da formatação
      trackEvent('format_success', {
        intent_mode: intentMode,
        profile: profile,
        plan: user.plan,
        input_length: inputText.trim().length,
        output_length: result.formatted_text.length,
        credits_remaining: result.credits_remaining,
        event_category: 'engagement',
        event_label: 'format_complete'
      });

      if (result.credits_remaining === 0) {
        toast.warning('Você usou todos os seus créditos!');
      } else if (result.credits_remaining > 0 && result.credits_remaining <= 5) {
        toast.warning(`Apenas ${result.credits_remaining} créditos restantes`);
      } else {
        toast.success('Texto formatado com sucesso!');
      }
    } catch (error) {
      if (error instanceof FormatterError) {
        switch (error.code) {
          case 'AUTH_REQUIRED':
            toast.error('Por favor, faça login novamente');
            setLocation('/auth');
            break;
          case 'NO_CREDITS':
            setUpgradeModalOpen(true);
            break;
          case 'VALIDATION_ERROR':
            toast.error(error.message);
            break;
          case 'NETWORK_ERROR':
            toast.error('Verifique sua conexão com a internet');
            break;
          default:
            toast.error('Algo deu errado. Por favor, tente novamente');
            break;
        }
      } else {
        toast.error('Algo deu errado. Por favor, tente novamente.');
      }
      console.error('Formatting error:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!outputText) return;
    await handleFormat();
  };

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);

      trackEvent('text_copy', {
        intent_mode: intentMode,
        text_length: outputText.length,
        event_category: 'engagement',
        event_label: 'copy_formatted_output'
      });

      toast.success('Copiado!');
    } catch (error) {
      toast.error('Falha ao copiar');
    }
  }, [outputText, intentMode]);

  const handleSendToWhatsApp = useCallback(() => {
    if (!outputText) return;

    const encodedText = encodeURIComponent(outputText);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const whatsappUrl = isMobile
      ? `whatsapp://send?text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

    toast.success('Abrindo WhatsApp...');

    try {
      const newWindow = window.open(whatsappUrl, '_blank');

      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        setWhatsappFallbackOpen(true);
      }
    } catch (error) {
      setWhatsappFallbackOpen(true);
    }
  }, [outputText]);

  const handleCopyFromFallback = useCallback(async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      toast.success('Texto copiado! Cole no WhatsApp');
      setWhatsappFallbackOpen(false);
    } catch (error) {
      toast.error('Falha ao copiar');
    }
  }, [outputText]);

  const handleClearAll = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-3 sm:py-4 sm:px-6 lg:px-8 border-b border-border bg-background">
        <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Formatador de Mensagens IA
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
          Transforme suas mensagens com formatação avançada por IA
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <main className="flex-1 min-w-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className={`text-sm font-medium ${charCountColor}`}>
                {charCount}/5000
              </span>
              <div className="flex items-center gap-2">
                {outputText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isFormatting}
                    aria-label="Regenerate"
                    className="flex-1 sm:flex-none"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFormatting ? 'animate-spin' : ''}`} />
                    <span className="ml-2">Regenerar</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={!inputText && !outputText}
                  aria-label="Clear all"
                  className="flex-1 sm:flex-none"
                >
                  <Eraser className="w-4 h-4" />
                  <span className="ml-2">Limpar Tudo</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="input-text" className="block text-sm font-medium text-foreground mb-2">
                  Texto Original
                </label>
                <textarea
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Cole ou digite sua mensagem aqui..."
                  disabled={isFormatting}
                  className="w-full min-h-[180px] sm:min-h-[200px] px-3 sm:px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  aria-label="Original text input"
                />
              </div>

              {/* PAINEL DE CONTROLE INTEGRADO */}
              <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                {/* 1. Modo de Intenção */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    1. Qual a intenção da mensagem?
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setIntentMode('general')}
                      disabled={isFormatting}
                      className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        intentMode === 'general'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Geral
                    </button>
                    <button
                      onClick={() => {
                        if (user?.plan === 'free') {
                          setUpgradeReason('pro-style');
                          setUpgradeModalOpen(true);
                        } else {
                          setIntentMode('sales');
                        }
                      }}
                      disabled={isFormatting}
                      className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all relative ${
                        intentMode === 'sales'
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Vendas {user?.plan === 'free' && '🔒'}
                    </button>
                    <button
                      onClick={() => {
                        if (user?.plan === 'free') {
                          setUpgradeReason('pro-style');
                          setUpgradeModalOpen(true);
                        } else {
                          setIntentMode('notice');
                        }
                      }}
                      disabled={isFormatting}
                      className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                        intentMode === 'notice'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Aviso {user?.plan === 'free' && '🔒'}
                    </button>
                  </div>
                </div>

                {/* 2. Ajuste Fino (Expansível) */}
                <details className="group">
                  <summary className="cursor-pointer list-none flex items-center justify-between py-2 px-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors">
                    <span className="text-sm font-medium text-foreground">
                      Personalizar meu estilo ✨
                    </span>
                    <svg
                      className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>

                  <div className="mt-4 space-y-4 px-2">
                    {/* Nível de Destaque */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nível de Destaque
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProfile({ ...profile, style_level: 'clean' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.style_level === 'clean'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Discreto
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, style_level: 'balanced' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.style_level === 'balanced'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Equilibrado
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, style_level: 'flashy' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.style_level === 'flashy'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Chamativo
                        </button>
                      </div>
                    </div>

                    {/* Uso de Emojis */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Uso de Emojis
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProfile({ ...profile, emoji_mode: 'off' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.emoji_mode === 'off'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Desligado
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, emoji_mode: 'keep_only' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.emoji_mode === 'keep_only'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Manter os meus
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, emoji_mode: 'smart' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.emoji_mode === 'smart'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Adicionar emojis
                        </button>
                      </div>
                    </div>

                    {/* Layout do Texto */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Layout do Texto
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProfile({ ...profile, layout_mode: 'preserve' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.layout_mode === 'preserve'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Preservar original
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, layout_mode: 'blocks' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.layout_mode === 'blocks'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Organizar em blocos
                        </button>
                      </div>
                    </div>

                    {/* O que Destacar */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        O que Destacar?
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setProfile({ ...profile, highlight_mode: 'essential_only' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.highlight_mode === 'essential_only'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Só o essencial
                        </button>
                        <button
                          onClick={() => setProfile({ ...profile, highlight_mode: 'important_words' })}
                          disabled={isFormatting}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            profile.highlight_mode === 'important_words'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          Também palavras-chave
                        </button>
                      </div>
                    </div>
                  </div>
                </details>
              </div>

              <Button
                onClick={handleFormat}
                disabled={!isInputValid || isFormatting || (user?.plan === 'free' && user?.credits_remaining <= 0)}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all text-base sm:text-lg font-semibold"
                aria-label="Format with AI"
              >
                {isFormatting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Formatando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Formatar com IA ✨
                  </>
                )}
              </Button>

              {outputText && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label htmlFor="output-text" className="block text-sm font-medium text-foreground">
                    Formatado para WhatsApp
                  </label>
                  <div className="relative">
                    <textarea
                      id="output-text"
                      value={outputText}
                      readOnly
                      className="w-full min-h-[180px] sm:min-h-[200px] px-3 sm:px-4 py-3 bg-card border border-border rounded-lg text-foreground resize-y pr-12 text-sm sm:text-base"
                      aria-label="Formatted text output"
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-2 hover:bg-muted rounded-lg transition-colors touch-manipulation"
                      aria-label="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="flex-1 h-11 sm:h-10"
                      aria-label="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                    <Button
                      onClick={handleSendToWhatsApp}
                      className="flex-1 h-11 sm:h-10 bg-[#25D366] hover:bg-[#20BD5A] text-foreground border-0"
                      aria-label="Send to WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enviar para WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </main>

          <aside className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-6">
              <WhatsAppPreview text={previewText} isLoading={isFormatting} />
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {upgradeReason === 'pro-style'
                ? 'Desbloqueie os Estilos Profissionais'
                : 'Faça Upgrade para o Pro e Tenha Formatação Ilimitada'}
            </DialogTitle>
            <DialogDescription>
              {upgradeReason === 'pro-style'
                ? 'Os estilos Sales e Official são exclusivos do plano Pro. Faça upgrade para ter acesso a todos os estilos de formatação profissionais e créditos ilimitados.'
                : 'Você esgotou seus créditos gratuitos. Faça upgrade para o Pro e tenha formatação ilimitada de mensagens por IA.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setUpgradeModalOpen(false);
                setLocation('/pricing');
              }}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500"
            >
              Ver Planos Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappFallbackOpen} onOpenChange={setWhatsappFallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp Não Encontrado</DialogTitle>
            <DialogDescription>
              Não foi possível abrir o WhatsApp automaticamente. Copie o texto e cole manualmente no WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappFallbackOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCopyFromFallback}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-foreground"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Texto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
