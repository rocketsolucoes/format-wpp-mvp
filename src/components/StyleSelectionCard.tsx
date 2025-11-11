import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Check, Lock } from 'lucide-react';

interface StyleSelectionCardProps {
  styleId: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  exampleBadge: string;
  accentColor: 'emerald' | 'orange' | 'blue';
  isLastUsed?: boolean;
  onSelect: () => void;
  compact?: boolean;
  isPro?: boolean;
  userPlan?: 'free' | 'pro' | 'enterprise';
  onProClick?: () => void;
}

const colorClasses = {
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-500/50',
    bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
    shadow: 'hover:shadow-emerald-500/20',
    button: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30',
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  orange: {
    border: 'border-orange-500/30 hover:border-orange-500/50',
    bg: 'bg-orange-500/5 hover:bg-orange-500/10',
    shadow: 'hover:shadow-orange-500/20',
    button: 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-orange-500/30',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  },
  blue: {
    border: 'border-blue-500/30 hover:border-blue-500/50',
    bg: 'bg-blue-500/5 hover:bg-blue-500/10',
    shadow: 'hover:shadow-blue-500/20',
    button: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
};

export function StyleSelectionCard({
  styleId,
  icon,
  title,
  subtitle,
  description,
  exampleBadge,
  accentColor,
  isLastUsed,
  onSelect,
  compact = false,
  isPro = false,
  userPlan = 'free',
  onProClick,
}: StyleSelectionCardProps) {
  const colors = colorClasses[accentColor];
  const isLocked = isPro && userPlan === 'free';

  const handleSelect = () => {
    if (isLocked) {
      if (onProClick) {
        onProClick();
      }
      return;
    }
    localStorage.setItem('selectedStyle', styleId);
    localStorage.setItem('lastUsedStyle', styleId);
    if (onSelect) {
      onSelect();
    }
  };

  if (compact) {
    return (
      <Card
        className={`relative border ${colors.border} ${colors.bg} transition-all duration-200 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:scale-102 cursor-pointer'} ${colors.shadow} group`}
        onClick={handleSelect}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl flex-shrink-0 relative">
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 rounded">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
              )}
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
                {isPro && (
                  <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
            {isLastUsed && !isLocked && (
              <Badge className={`${colors.badge} text-[10px] px-1.5 py-0.5 flex items-center gap-1 flex-shrink-0`}>
                <Check className="w-2.5 h-2.5" />
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`relative border ${colors.border} ${colors.bg} transition-all duration-200 ${isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:scale-102 cursor-pointer'} ${colors.shadow} group`}
      onClick={handleSelect}
    >
      <CardContent className="p-4 text-center space-y-2">
        {isLastUsed && !isLocked && (
          <div className="absolute top-2 right-2">
            <Badge className={`${colors.badge} text-[10px] px-1.5 py-0.5 flex items-center gap-1`}>
              <Check className="w-2.5 h-2.5" />
              Último
            </Badge>
          </div>
        )}

        {isPro && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0.5">
              PRO
            </Badge>
          </div>
        )}

        <div className="text-3xl relative">
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>
          )}
          {icon}
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        <Button
          className={`w-full ${colors.button} border transition-all text-xs h-8`}
          onClick={(e) => {
            e.stopPropagation();
            handleSelect();
          }}
        >
          {isLocked ? (
            <>
              <Lock className="w-3 h-3 mr-1" />
              Upgrade para Pro
            </>
          ) : (
            `Usar ${title}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
