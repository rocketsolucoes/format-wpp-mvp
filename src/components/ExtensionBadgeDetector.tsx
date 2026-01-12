import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/Alert';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';

export function ExtensionBadgeDetector() {
  const [showAlert, setShowAlert] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkForExtensionBadges = () => {
      const vimiumSelectors = [
        'div[class*="vimium"]',
        'div[id*="vimium"]',
        'div[class*="surfingkeys"]',
        'div[class*="link-hint"]',
        'div[class*="linkHint"]',
        'span[data-key]',
        'div[data-key]'
      ];

      for (const selector of vimiumSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const stored = localStorage.getItem('extension-badge-alert-dismissed');
          if (!stored || stored !== 'true') {
            setShowAlert(true);
          }
          return;
        }
      }
    };

    const timeout = setTimeout(checkForExtensionBadges, 2000);
    const interval = setInterval(checkForExtensionBadges, 10000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setShowAlert(false);
    localStorage.setItem('extension-badge-alert-dismissed', 'true');
  };

  const handleDontShowAgain = () => {
    handleDismiss();
  };

  if (!showAlert || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-slide-in">
      <Alert variant="warning" className="bg-yellow-900/90 border-yellow-600/50 backdrop-blur-sm shadow-2xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <h4 className="font-semibold text-foreground">Badges Numerados Detectados</h4>
            <AlertDescription className="text-yellow-100/90 text-sm leading-relaxed">
              Detectamos badges numerados na interface. Eles são injetados por extensões como
              <strong className="text-yellow-200"> Vimium</strong> ou
              <strong className="text-yellow-200"> Surfingkeys</strong>.
              Não fazem parte da aplicação.
              <br />
              <br />
              <strong>Solução:</strong> Desative a extensão ou adicione este site à lista de exclusão.
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                onClick={handleDontShowAgain}
                className="text-xs py-1.5 px-3 h-auto"
              >
                Não mostrar novamente
              </Button>
              <Button
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs py-1.5 px-3 h-auto"
              >
                <X className="w-3 h-3 mr-1" />
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}
