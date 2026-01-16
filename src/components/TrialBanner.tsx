import React from 'react';
import { Sparkles, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTrialStatus } from '../hooks/useTrialStatus';

/**
 * TrialBanner Component
 * 
 * Displays a prominent banner showing trial status and days remaining.
 * Colors and messaging change based on urgency (new → low → medium → high).
 * More detailed for new users, more urgent as trial expires.
 */
export function TrialBanner() {
  const [, setLocation] = useLocation();
  const { trialInfo, isLoading } = useTrialStatus();

  if (isLoading || !trialInfo?.isActive) return null;

  const { daysLeft, hoursLeft } = trialInfo;

  // Calculate urgency level
  const getUrgencyLevel = (): 'low' | 'medium' | 'high' | 'new' => {
    if (daysLeft >= 6) return 'new'; // First 2 days - welcome message
    if (daysLeft > 2) return 'low';
    if (daysLeft >= 1) return 'medium';
    return 'high';
  };

  const urgency = getUrgencyLevel();

  // Get colors based on urgency
  const getColors = () => {
    switch (urgency) {
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 dark:from-red-500/20 dark:via-orange-500/20 dark:to-red-500/20',
          border: 'border-red-500/30',
          text: 'text-red-700 dark:text-red-300',
          icon: 'text-red-600 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white shadow-lg',
          pulse: true,
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 dark:from-yellow-500/20 dark:via-amber-500/20 dark:to-yellow-500/20',
          border: 'border-yellow-500/30',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: 'text-yellow-600 dark:text-yellow-400',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg',
          pulse: false,
        };
      case 'new':
        return {
          bg: 'bg-gradient-to-r from-emerald-500/15 via-cyan-500/15 to-blue-500/15 dark:from-emerald-500/25 dark:via-cyan-500/25 dark:to-blue-500/25',
          border: 'border-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-300',
          icon: 'text-emerald-600 dark:text-emerald-400',
          button: 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white shadow-lg',
          pulse: false,
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-emerald-500/10 dark:from-emerald-500/20 dark:via-green-500/20 dark:to-emerald-500/20',
          border: 'border-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-300',
          icon: 'text-emerald-600 dark:text-emerald-400',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg',
          pulse: false,
        };
    }
  };

  // Get message based on urgency
  const getMessage = () => {
    if (hoursLeft < 24) {
      return {
        title: '⚠️ Último dia do seu trial!',
        subtitle: `Restam apenas ${hoursLeft} horas para aproveitar todos os recursos Pro`,
      };
    }
    if (daysLeft <= 1) {
      return {
        title: '⏰ Seu trial acaba amanhã!',
        subtitle: 'Não perca acesso aos recursos Pro - assine agora com desconto',
      };
    }
    if (daysLeft <= 2) {
      return {
        title: `⏰ Restam ${daysLeft} dias do seu trial Pro`,
        subtitle: 'Aproveite ao máximo os recursos ilimitados enquanto pode',
      };
    }
    if (daysLeft >= 6) {
      return {
        title: '🎉 Bem-vindo ao seu trial Pro de 7 dias!',
        subtitle: 'Aproveite créditos ilimitados, estilos exclusivos e análises avançadas',
      };
    }
    return {
      title: `✨ Você tem ${daysLeft} dias de trial Pro!`,
      subtitle: 'Continue aproveitando todos os recursos premium sem limites',
    };
  };

  const colors = getColors();
  const message = getMessage();
  const showDetailedInfo = urgency === 'new'; // Show more info for new users

  return (
    <div
      className={`${colors.bg} border-2 ${colors.border} rounded-xl p-5 transition-all duration-300 animate-in slide-in-from-top-4 shadow-lg ${colors.pulse ? 'animate-pulse' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <Sparkles className={`w-6 h-6 ${colors.icon}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-base font-bold ${colors.text} mb-1`}>
              {message.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {message.subtitle}
            </p>
            
            {showDetailedInfo && (
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-medium text-foreground">
                  <Zap className="w-3 h-3" />
                  Créditos ilimitados
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-medium text-foreground">
                  <TrendingUp className="w-3 h-3" />
                  Estilos Pro
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/50 dark:bg-black/20 rounded-md text-xs font-medium text-foreground">
                  <BarChart3 className="w-3 h-3" />
                  Análises
                </span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              {hoursLeft < 24 
                ? `Expira em ${hoursLeft} horas` 
                : `Expira em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`
              }
            </p>
          </div>
        </div>
        <button
          onClick={() => setLocation('/pricing')}
          className={`flex-shrink-0 px-5 py-2.5 ${colors.button} rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap hover:scale-105`}
        >
          {urgency === 'high' ? 'Assinar agora!' : 'Ver planos'}
        </button>
      </div>
    </div>
  );
}
