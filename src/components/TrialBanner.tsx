import React from 'react';
import { Clock, Sparkles, Zap } from 'lucide-react';
import { Button } from './ui/Button';
import { useLocation } from 'wouter';
import { useTrialStatus } from '../hooks/useTrialStatus';

/**
 * TrialBanner Component
 * 
 * Displays a banner showing trial status and days remaining.
 * Colors change based on urgency (green → yellow → red).
 */
export function TrialBanner() {
  const [, setLocation] = useLocation();
  const { trialInfo, isLoading } = useTrialStatus();

  if (isLoading || !trialInfo?.isActive) return null;

  const { daysLeft, hoursLeft } = trialInfo;

  // Determine colors based on days left
  const getColors = () => {
    if (daysLeft === 0) {
      // Last day - red (urgent)
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800/30',
        text: 'text-red-900 dark:text-red-100',
        icon: 'text-red-600 dark:text-red-400',
      };
    }
    if (daysLeft <= 2) {
      // 1-2 days - yellow (warning)
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800/30',
        text: 'text-yellow-900 dark:text-yellow-100',
        icon: 'text-yellow-600 dark:text-yellow-400',
      };
    }
    // 3+ days - green (good)
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-200 dark:border-emerald-800/30',
      text: 'text-emerald-900 dark:text-emerald-100',
      icon: 'text-emerald-600 dark:text-emerald-400',
    };
  };

  const colors = getColors();

  // Message based on days left
  const getMessage = () => {
    if (daysLeft === 0) {
      if (hoursLeft <= 1) {
        return '⚠️ Menos de 1 hora restante do seu trial Pro!';
      }
      return `⚠️ Último dia! ${hoursLeft} horas restantes do seu trial Pro!`;
    }
    if (daysLeft === 1) {
      return '⏰ Amanhã seu trial Pro expira!';
    }
    if (daysLeft <= 2) {
      return `⏰ Restam ${daysLeft} dias do seu trial Pro!`;
    }
    return `🎉 Você tem ${daysLeft} dias de trial Pro!`;
  };

  const getIcon = () => {
    if (daysLeft === 0) return <Zap className={`w-5 h-5 ${colors.icon}`} />;
    if (daysLeft <= 2) return <Clock className={`w-5 h-5 ${colors.icon}`} />;
    return <Sparkles className={`w-5 h-5 ${colors.icon}`} />;
  };

  return (
    <div className={`rounded-xl border ${colors.bg} ${colors.border} p-4 mb-6 transition-all`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {getIcon()}
          <div className="flex-1">
            <p className={`font-semibold ${colors.text}`}>
              {getMessage()}
            </p>
            <p className={`text-sm opacity-80 ${colors.text}`}>
              Aproveite todos os recursos premium gratuitamente
            </p>
          </div>
        </div>
        <Button
          onClick={() => setLocation('/pricing')}
          variant={daysLeft === 0 ? 'default' : 'outline'}
          size="sm"
          className={daysLeft === 0 ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white' : ''}
        >
          {daysLeft === 0 ? 'Assinar Agora!' : 'Continuar com Pro'}
        </Button>
      </div>
    </div>
  );
}
