import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Button } from './ui/Button';
import { Lock, Sparkles, CheckCircle, Heart } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';

/**
 * TrialExpiredModal Component
 * 
 * Modal shown when user's trial expires.
 * Encourages conversion to paid plan.
 */
export function TrialExpiredModal() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 🛡️ RULE: Never show to paying customers
    if (user?.subscription_status === 'active') {
      return;
    }

    // Show modal if trial just expired
    if (user?.trial_status === 'expired') {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.trial_status, user?.subscription_status]);

  const handleUpgrade = () => {
    setIsOpen(false);
    setLocation('/pricing');
  };

  const handleContinueFree = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/30">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Seu trial de 7 dias expirou
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-muted-foreground">
            Esperamos que tenha aproveitado todos os recursos premium! 🎉
          </p>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-emerald-500" />
              <p className="font-semibold text-sm">O que você ganhou com o Pro:</p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Créditos ilimitados para formatação</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Histórico completo de mensagens</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Análises avançadas de uso</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Estilos favoritos salvos</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-foreground mb-1">
              💰 Apenas R$ 24,90/mês
            </p>
            <p className="text-xs text-muted-foreground">
              ou R$ 273,90/ano (economize 8%)
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold"
              size="lg"
            >
              <Lock className="w-4 h-4 mr-2" />
              Continuar com Pro
            </Button>
            <Button
              onClick={handleContinueFree}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Continuar com plano Free
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Você pode assinar a qualquer momento e reativar todos os recursos Pro
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
