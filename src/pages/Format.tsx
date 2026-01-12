import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles, Copy, RefreshCw, Eraser, MessageCircle } from 'lucide-react';
import { toast } from '../components/ui/Toaster';
import { formatText, FormatterError } from '../services/formatter';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Button } from '../components/ui/Button';
import { StyleSelector } from '../components/StyleSelector';
import { WhatsAppPreview } from '../components/WhatsAppPreview';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from '../components/ui/Dialog';
import { getPendingText, clearPendingText, getFormattedPreview, clearFormattedPreview } from '../utils/textPersistence';

export default function Format() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('casual');
  const [previewText, setPreviewText] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'credits' | 'pro-style'>('credits');
  const [whatsappFallbackOpen, setWhatsappFallbackOpen] = useState(false);
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const pendingText = getPendingText();
    const formattedPreview = getFormattedPreview();
    const reformatText = localStorage.getItem('reformat_text');
    const reformatStyle = localStorage.getItem('reformat_style');
    const selectedStyleFromDashboard = localStorage.getItem('selectedStyle');

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

    if (reformatStyle) {
      setSelectedStyle(reformatStyle);
      localStorage.removeItem('reformat_style');
    } else if (selectedStyleFromDashboard) {
      setSelectedStyle(selectedStyleFromDashboard);
      localStorage.removeItem('selectedStyle');

      const styleName = selectedStyleFromDashboard === 'casual' ? 'Casual' : selectedStyleFromDashboard === 'sales' ? 'Sales' : 'Official';
      toast.success(`Estilo ${styleName} selecionado. Cole seu texto para começar!`);
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
      setUpgradeReason('credits');
      setUpgradeModalOpen(true);
      return;
    }

    const proStyles = ['sales', 'announcement'];
    if (user.plan === 'free' && proStyles.includes(selectedStyle)) {
      setUpgradeReason('pro-style');
      setUpgradeModalOpen(true);
      return;
    }

    setIsFormatting(true);

    console.log('Format.tsx - selectedStyle:', selectedStyle);

    try {
      const result = await formatText(inputText.trim(), selectedStyle);
      setOutputText(result.formatted_text);
      await refreshUser();

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
      toast.success('Copiado!');
    } catch (error) {
      toast.error('Falha ao copiar');
    }
  }, [outputText]);

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
        <div className="lg:hidden mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">Estilos de Formatação</h2>
          <StyleSelector
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            userPlan={user?.plan || 'free'}
            onProStyleClick={() => {
              setUpgradeReason('pro-style');
              setUpgradeModalOpen(true);
            }}
          />
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3">Estilos de Formatação</h2>
                <StyleSelector
                  selectedStyle={selectedStyle}
                  onStyleChange={setSelectedStyle}
                  userPlan={user?.plan || 'free'}
                  onProStyleClick={() => {
                    setUpgradeReason('pro-style');
                    setUpgradeModalOpen(true);
                  }}
                />
              </div>
            </div>
          </aside>

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
