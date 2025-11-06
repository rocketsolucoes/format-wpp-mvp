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

export default function Format() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string>('casual');
  const [previewText, setPreviewText] = useState('');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [whatsappFallbackOpen, setWhatsappFallbackOpen] = useState(false);
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPreviewText(outputText || inputText);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputText, outputText]);

  const charCount = inputText.length;
  const charCountColor = charCount > 4500 ? 'text-red-400' : charCount > 4000 ? 'text-yellow-400' : 'text-slate-400';
  const isInputValid = inputText.trim().length >= 10 && inputText.length <= 5000;

  const handleFormat = async () => {
    if (!isInputValid) {
      toast.error('Please enter text between 10 and 5000 characters');
      return;
    }

    if (!user) {
      toast.error('Please sign in to format text');
      setLocation('/auth');
      return;
    }

    if (user.plan === 'free' && user.credits_remaining <= 0) {
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
        toast.warning('You have used all your credits!');
      } else if (result.credits_remaining > 0 && result.credits_remaining <= 5) {
        toast.warning(`Only ${result.credits_remaining} credits remaining`);
      } else {
        toast.success('Text formatted successfully!');
      }
    } catch (error) {
      if (error instanceof FormatterError) {
        switch (error.code) {
          case 'AUTH_REQUIRED':
            toast.error('Please sign in again');
            setLocation('/auth');
            break;
          case 'NO_CREDITS':
            setUpgradeModalOpen(true);
            break;
          case 'VALIDATION_ERROR':
            toast.error(error.message);
            break;
          case 'NETWORK_ERROR':
            toast.error('Check your internet connection');
            break;
          default:
            toast.error('Something went wrong. Please try again.');
            break;
        }
      } else {
        toast.error('Something went wrong. Please try again.');
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
      toast.success('Copied!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [outputText]);

  const handleSendToWhatsApp = useCallback(() => {
    if (!outputText) return;

    const encodedText = encodeURIComponent(outputText);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const whatsappUrl = isMobile
      ? `whatsapp://send?text=${encodedText}`
      : `https://web.whatsapp.com/send?text=${encodedText}`;

    toast.info('Opening WhatsApp...');

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
      toast.success('Text copied! Paste it in WhatsApp');
      setWhatsappFallbackOpen(false);
    } catch (error) {
      toast.error('Failed to copy');
    }
  }, [outputText]);

  const handleClearAll = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          AI Message Formatter
        </h1>
        <p className="text-slate-400 text-sm">
          Transform your messages with advanced AI-powered formatting
        </p>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white mb-3">Formatting Styles</h2>
                <StyleSelector
                  selectedStyle={selectedStyle}
                  onStyleChange={setSelectedStyle}
                />
              </div>
            </div>
          </aside>

          <div className="lg:hidden mb-4">
            <h2 className="text-sm font-semibold text-white mb-3">Formatting Styles</h2>
            <StyleSelector
              selectedStyle={selectedStyle}
              onStyleChange={setSelectedStyle}
            />
          </div>

          <main className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
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
                  >
                    <RefreshCw className={`w-4 h-4 ${isFormatting ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline ml-2">Regenerate</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={!inputText && !outputText}
                  aria-label="Clear all"
                >
                  <Eraser className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Clear All</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="input-text" className="block text-sm font-medium text-white mb-2">
                  Original Text
                </label>
                <textarea
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste or type your message here..."
                  disabled={isFormatting}
                  className="w-full min-h-[200px] px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Original text input"
                />
              </div>

              <Button
                onClick={handleFormat}
                disabled={!isInputValid || isFormatting || (user?.plan === 'free' && user?.credits_remaining <= 0)}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all"
                aria-label="Format with AI"
              >
                {isFormatting ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Formatting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Format with AI ✨
                  </>
                )}
              </Button>

              {outputText && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label htmlFor="output-text" className="block text-sm font-medium text-white">
                    Formatted for WhatsApp
                  </label>
                  <div className="relative">
                    <textarea
                      id="output-text"
                      value={outputText}
                      readOnly
                      className="w-full min-h-[200px] px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-y pr-12"
                      aria-label="Formatted text output"
                    />
                    <button
                      onClick={handleCopy}
                      className="absolute top-3 right-3 p-2 hover:bg-slate-800 rounded-lg transition-colors"
                      aria-label="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="outline"
                      className="flex-1"
                      aria-label="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleSendToWhatsApp}
                      className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white border-0"
                      aria-label="Send to WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Send to WhatsApp
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
            <DialogTitle>Upgrade to Pro for Unlimited Formatting</DialogTitle>
            <DialogDescription>
              You've run out of free credits. Upgrade to Pro to get unlimited AI-powered message formatting.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setUpgradeModalOpen(false);
                setLocation('/pricing');
              }}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500"
            >
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={whatsappFallbackOpen} onOpenChange={setWhatsappFallbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp Not Found</DialogTitle>
            <DialogDescription>
              Couldn't open WhatsApp automatically. Copy the text and paste it manually in WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappFallbackOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCopyFromFallback}
              className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Text
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
