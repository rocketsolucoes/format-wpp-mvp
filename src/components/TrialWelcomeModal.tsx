import React, { useEffect, useState } from 'react';
import { X, Sparkles, Zap, Clock, TrendingUp, BarChart3, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

/**
 * TrialWelcomeModal Component
 * 
 * Welcome modal shown to new users when they first access the system.
 * Explains the 7-day Pro trial and its benefits.
 * Only shows once per user (controlled by trial_welcome_shown flag).
 */
export function TrialWelcomeModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 🛡️ RULE: Never show to paying customers
    if (user?.subscription_status === 'active') {
      return;
    }

    // Only show if:
    // 1. User is logged in
    // 2. Trial is active
    // 3. Welcome modal hasn't been shown yet
    if (
      user &&
      user.trial_status === 'active' &&
      user.trial_welcome_shown === false
    ) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = async () => {
    setIsOpen(false);

    // Mark welcome as shown
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ trial_welcome_shown: true })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error marking welcome as shown:', error);
      }
    }
  };

  if (!isOpen) return null;

  const trialEndDate = user?.trial_end_date
    ? new Date(user.trial_end_date)
    : null;

  const daysLeft = trialEndDate
    ? Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-500 p-8 rounded-t-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20"></div>
          
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative text-center text-white">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4 border-4 border-white/30">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold mb-2">
              Bem-vindo ao ZapStyle! 🎉
            </h2>
            <p className="text-lg text-white/90">
              Você ganhou <span className="font-bold">{daysLeft} dias grátis</span> do plano Pro!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3 text-foreground">
              Durante o seu trial, você tem acesso a:
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Benefit 1 */}
              <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Créditos Ilimitados</h4>
                  <p className="text-sm text-muted-foreground">
                    Formate quantas mensagens quiser, sem limites!
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Estilos Pro</h4>
                  <p className="text-sm text-muted-foreground">
                    Acesso a Sales e Official para mensagens persuasivas
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Histórico Completo</h4>
                  <p className="text-sm text-muted-foreground">
                    Acesse todas suas formatações sem limite de tempo
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Análises Avançadas</h4>
                  <p className="text-sm text-muted-foreground">
                    Gráficos e insights sobre seu uso do sistema
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trial info */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Seu trial expira em {daysLeft} dias.</span>
                  {' '}Após esse período, você pode continuar usando o plano Free (30 créditos/mês) ou assinar o Pro para manter todos os benefícios.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Começar a usar agora! 🚀
            </button>
            <button
              onClick={() => {
                handleClose();
                window.location.href = '/pricing';
              }}
              className="px-6 py-3 bg-card hover:bg-muted border border-border text-foreground font-medium rounded-lg transition-colors"
            >
              Ver planos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
