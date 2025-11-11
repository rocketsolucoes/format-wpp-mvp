import React from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Check } from 'lucide-react';

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
}: StyleSelectionCardProps) {
  const colors = colorClasses[accentColor];

  const handleSelect = () => {
    localStorage.setItem('selectedStyle', styleId);
    localStorage.setItem('lastUsedStyle', styleId);
    if (onSelect) {
      onSelect();
    }
  };

  if (compact) {
    return (
      <Card
        className={`relative border ${colors.border} ${colors.bg} transition-all duration-200 hover:shadow-md ${colors.shadow} hover:scale-102 cursor-pointer group`}
        onClick={handleSelect}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="text-2xl flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
            {isLastUsed && (
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
      className={`relative border ${colors.border} ${colors.bg} transition-all duration-200 hover:shadow-md ${colors.shadow} hover:scale-102 cursor-pointer group`}
      onClick={handleSelect}
    >
      <CardContent className="p-4 text-center space-y-2">
        {isLastUsed && (
          <div className="absolute top-2 right-2">
            <Badge className={`${colors.badge} text-[10px] px-1.5 py-0.5 flex items-center gap-1`}>
              <Check className="w-2.5 h-2.5" />
              Último
            </Badge>
          </div>
        )}

        <div className="text-3xl">{icon}</div>

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
          Usar {title}
        </Button>
      </CardContent>
    </Card>
  );
}
