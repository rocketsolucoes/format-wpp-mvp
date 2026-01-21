import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Copy, RefreshCw, Eraser, MessageCircle, ChevronDown, HelpCircle } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import { formatText, FormatterError, UserFormattingProfile } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { trackEvent } from '../hooks/useAnalytics';
import { useLocation } from 'wouter';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/ui/Button';
import { WhatsAppPreview } from '../components/WhatsAppPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import { getPendingText, clearPendingText, getFormattedPreview, clearFormattedPreview } from '../utils/textPersistence';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { Tooltip } from '../components/ui/Tooltip';

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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* SIDEBAR DE CONTROLES - Desktop */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              {/* Modo de Intenção */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    🎯 Modo de Intenção
                  </h3>
                  <Tooltip content="Define o tom e estilo geral da mensagem. Cada modo ajusta persuasão, urgência e call-to-action." side="right">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => setIntentMode('general')}
                    disabled={isFormatting}
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all text-left ${
                      intentMode === 'general'
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-2">
                      <span>💬</span>
                      <span>Geral</span>
                    </div>
                    <p className="text-xs mt-1 opacity-75">Tom amigável</p>
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
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all text-left ${
                      intentMode === 'sales'
                        ? 'bg-orange-500 text-white shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-2">
                      <span>🔥</span>
                      <span>Vendas</span>
                      {user?.plan === 'free' && <span className="ml-auto text-xs">🔒 PRO</span>}
                    </div>
                    <p className="text-xs mt-1 opacity-75">Tom persuasivo</p>
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
                    className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all text-left ${
                      intentMode === 'notice'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-2">
                      <span>📢</span>
                      <span>Aviso</span>
                      {user?.plan === 'free' && <span className="ml-auto text-xs">🔒 PRO</span>}
                    </div>
                    <p className="text-xs mt-1 opacity-75">Tom autoritário</p>
                  </button>
                </div>
              </div>

              {/* Ajustes Finos */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    ✨ Ajustes Finos
                  </h3>
                  <Tooltip content="Personalize detalhes da formatação. Estas preferências são salvas automaticamente." side="right">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </Tooltip>
                </div>
                <div className="space-y-4">
                  {/* Nível de Destaque */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Destaque
                      </label>
                      <Tooltip content="Controla a quantidade de negritos e itálicos. Discreto usa pouco, Chamativo usa muito." side="right">
                        <HelpCircle className="w-3 h-3 text-muted-foreground/70 cursor-help" />
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['clean', 'balanced', 'flashy'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() => setProfile({ ...profile, style_level: level })}
                          disabled={isFormatting}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            profile.style_level === level
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          {level === 'clean' ? '●' : level === 'balanced' ? '●●' : '●●●'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {profile.style_level === 'clean' ? 'Discreto' : profile.style_level === 'balanced' ? 'Equilibrado' : 'Chamativo'}
                    </p>
                  </div>

                  {/* Emojis */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Emojis
                      </label>
                      <Tooltip content="Desligado remove todos, Manter preserva os seus, Adicionar insere emojis relevantes." side="right">
                        <HelpCircle className="w-3 h-3 text-muted-foreground/70 cursor-help" />
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['off', 'keep_only', 'smart'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setProfile({ ...profile, emoji_mode: mode })}
                          disabled={isFormatting}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            profile.emoji_mode === mode
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          {mode === 'off' ? '🚫' : mode === 'keep_only' ? '🔄' : '✨'}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {profile.emoji_mode === 'off' ? 'Desligado' : profile.emoji_mode === 'keep_only' ? 'Manter' : 'Adicionar'}
                    </p>
                  </div>

                  {/* Layout */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Layout
                      </label>
                      <Tooltip content="Original mantém a estrutura, Blocos reorganiza em parágrafos lógicos com quebras de linha." side="right">
                        <HelpCircle className="w-3 h-3 text-muted-foreground/70 cursor-help" />
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(['preserve', 'blocks'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setProfile({ ...profile, layout_mode: mode })}
                          disabled={isFormatting}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            profile.layout_mode === mode
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          {mode === 'preserve' ? 'Original' : 'Blocos'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Destacar */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Destacar
                      </label>
                      <Tooltip content="Essencial destaca só preços/datas/CTAs, Tudo inclui também palavras-chave importantes." side="right">
                        <HelpCircle className="w-3 h-3 text-muted-foreground/70 cursor-help" />
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(['essential_only', 'important_words'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setProfile({ ...profile, highlight_mode: mode })}
                          disabled={isFormatting}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition-all ${
                            profile.highlight_mode === mode
                              ? 'bg-emerald-500 text-white'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          } disabled:opacity-50`}
                        >
                          {mode === 'essential_only' ? 'Essencial' : 'Tudo'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* CONTROLES MOBILE - Colapsável no topo */}
          <div className="lg:hidden bg-card border border-border rounded-lg p-4 space-y-4">
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between font-medium text-sm">
                <span>🎯 Configurações de Formatação</span>
                <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-4 space-y-4">
                {/* Modo Mobile */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    Modo de Intenção
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setIntentMode('general')}
                      disabled={isFormatting}
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        intentMode === 'general' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      💬 Geral
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
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        intentMode === 'sales' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      🔥 Vendas {user?.plan === 'free' && '🔒'}
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
                      className={`px-3 py-2 rounded-lg text-xs font-medium ${
                        intentMode === 'notice' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      📢 Aviso {user?.plan === 'free' && '🔒'}
                    </button>
                  </div>
                </div>

                {/* Ajustes Mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Destaque</label>
                    <select
                      value={profile.style_level}
                      onChange={(e) => setProfile({ ...profile, style_level: e.target.value as any })}
                      className="w-full px-2 py-1.5 rounded bg-muted text-xs"
                    >
                      <option value="clean">Discreto</option>
                      <option value="balanced">Equilibrado</option>
                      <option value="flashy">Chamativo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Emojis</label>
                    <select
                      value={profile.emoji_mode}
                      onChange={(e) => setProfile({ ...profile, emoji_mode: e.target.value as any })}
                      className="w-full px-2 py-1.5 rounded bg-muted text-xs"
                    >
                      <option value="off">Desligado</option>
                      <option value="keep_only">Manter</option>
                      <option value="smart">Adicionar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Layout</label>
                    <select
                      value={profile.layout_mode}
                      onChange={(e) => setProfile({ ...profile, layout_mode: e.target.value as any })}
                      className="w-full px-2 py-1.5 rounded bg-muted text-xs"
                    >
                      <option value="preserve">Original</option>
                      <option value="blocks">Blocos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Destacar</label>
                    <select
                      value={profile.highlight_mode}
                      onChange={(e) => setProfile({ ...profile, highlight_mode: e.target.value as any })}
                      className="w-full px-2 py-1.5 rounded bg-muted text-xs"
                    >
                      <option value="essential_only">Essencial</option>
                      <option value="important_words">Tudo</option>
                    </select>
                  </div>
                </div>
              </div>
            </details>
          </div>

          {/* CONTEÚDO PRINCIPAL */}
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

          {/* PREVIEW WHATSAPP - Desktop */}
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
                ? 'Desbloqueie os Modos Profissionais'
                : 'Faça Upgrade para o Pro e Tenha Formatação Ilimitada'}
            </DialogTitle>
            <DialogDescription>
              {upgradeReason === 'pro-style'
                ? 'Os modos Vendas e Aviso são exclusivos do plano Pro. Faça upgrade para ter acesso a todos os modos de formatação profissionais e créditos ilimitados.'
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
