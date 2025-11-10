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
}: StyleSelectionCardProps) {
  const colors = colorClasses[accentColor];

  return (
    <Card
      className={`relative border-2 ${colors.border} ${colors.bg} transition-all duration-300 hover:shadow-lg ${colors.shadow} hover:scale-105 cursor-pointer group`}
      onClick={onSelect}
    >
      <CardContent className="p-6 text-center space-y-4">
        {isLastUsed && (
          <div className="absolute top-3 right-3">
            <Badge className={`${colors.badge} text-xs flex items-center gap-1`}>
              <Check className="w-3 h-3" />
              Último usado
            </Badge>
          </div>
        )}

        <div className="text-5xl mb-2">{icon}</div>

        <div>
          <h3 className="text-xl font-bold text-slate-200 mb-1">{title}</h3>
          <p className="text-sm font-medium text-slate-400">{subtitle}</p>
        </div>

        <p className="text-sm text-slate-500 min-h-[40px]">{description}</p>

        <Badge className={`${colors.badge} text-xs`}>{exampleBadge}</Badge>

        <Button
          className={`w-full ${colors.button} border transition-all`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Usar Estilo {title}
        </Button>
      </CardContent>
    </Card>
  );
}
