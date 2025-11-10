import React, { useEffect, useRef } from 'react';
import { Smile, Flame, Megaphone, Check } from 'lucide-react';
import { Card, CardContent } from './ui/Card';

interface Style {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  isPro: boolean;
}

const styles: Style[] = [
  {
    id: 'casual',
    name: 'Casual Amigável',
    description: 'Tom caloroso e conversacional',
    icon: Smile,
    color: 'green',
    isPro: false,
  },
  {
    id: 'sales',
    name: 'Vendas Persuasivo',
    description: 'Copy de alta conversão com urgência',
    icon: Flame,
    color: 'orange',
    isPro: false,
  },
  {
    id: 'announcement',
    name: 'Anúncio Importante',
    description: 'Avisos claros e autoritários',
    icon: Megaphone,
    color: 'red',
    isPro: false,
  },
];

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleChange: (styleId: string) => void;
  userPlan: 'free' | 'pro' | 'enterprise';
}

const colorClasses = {
  green: {
    icon: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    shadow: 'shadow-green-500/50',
  },
  orange: {
    icon: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500',
    shadow: 'shadow-orange-500/50',
  },
  red: {
    icon: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    shadow: 'shadow-red-500/50',
  },
};

const tooltips: Record<string, string> = {
  casual: `Perfeito para:
• Mensagens amigáveis
• Anúncios de produtos
• Comunicação geral

Adiciona emojis e formatação mantendo seu texto original.`,
  sales: `Perfeito para:
• Promoções e ofertas
• Lançamentos de produtos
• Mensagens de vendas

Destaca preços e benefícios com negrito e emojis.`,
  announcement: `Perfeito para:
• Avisos oficiais
• Atualizações importantes
• Comunicações de equipe

Organiza informações claramente com formatação estruturada.`,
};

export function StyleSelector({ selectedStyle, onStyleChange }: StyleSelectorProps) {
  const [focusedIndex, setFocusedIndex] = React.useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const selectedIndex = styles.findIndex((style) => style.id === selectedStyle);
    if (selectedIndex !== -1) {
      setFocusedIndex(selectedIndex);
    }
  }, [selectedStyle]);

  const handleStyleClick = (style: Style, index: number) => {
    onStyleChange(style.id);
    setFocusedIndex(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        newIndex = Math.min(index + 1, styles.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        newIndex = Math.max(index - 1, 0);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleStyleClick(styles[index], index);
        return;
      default:
        return;
    }

    setFocusedIndex(newIndex);
    cardRefs.current[newIndex]?.focus();
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      {styles.map((style, index) => {
        const isActive = selectedStyle === style.id;
        const colors = colorClasses[style.color as keyof typeof colorClasses];
        const Icon = style.icon;
        const tooltip = tooltips[style.id];

        return (
          <Card
            key={style.id}
            ref={(el) => (cardRefs.current[index] = el)}
            tabIndex={0}
            role="button"
            title={tooltip}
            aria-label={`${style.name}${isActive ? ' - Selecionado atualmente' : ''}`}
            aria-pressed={isActive}
            onClick={() => handleStyleClick(style, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative cursor-pointer transition-all duration-200
              ${isActive
                ? `border-2 ${colors.border} shadow-lg ${colors.shadow}`
                : 'border-slate-700 hover:border-slate-600 active:border-slate-500'
              }
              hover:scale-[1.01] hover:shadow-md hover:-translate-y-0.5
              active:scale-[0.99]
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950
              touch-manipulation
            `}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={`p-2.5 sm:p-3 rounded-lg ${colors.bg} flex-shrink-0`}>
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm leading-tight mb-0.5">
                    {style.name}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-snug">
                    {style.description}
                  </p>
                </div>
              </div>

              {isActive && (
                <div
                  className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center animate-in zoom-in duration-200`}
                >
                  <Check className={`w-3 h-3 ${colors.icon}`} strokeWidth={3} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
