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
    name: 'Casual Friendly',
    description: 'Warm and conversational tone',
    icon: Smile,
    color: 'green',
    isPro: false,
  },
  {
    id: 'sales',
    name: 'Persuasive Sales',
    description: 'High-conversion copy with urgency',
    icon: Flame,
    color: 'orange',
    isPro: false,
  },
  {
    id: 'announcement',
    name: 'Important Announcement',
    description: 'Clear and authoritative notices',
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
  casual: `Perfect for:
• Friendly messages
• Product announcements
• General communication

Adds emojis and formatting while keeping your original text.`,
  sales: `Perfect for:
• Promotions and offers
• Product launches
• Sales messages

Highlights prices and benefits with bold formatting and emojis.`,
  announcement: `Perfect for:
• Official notices
• Important updates
• Team communications

Organizes information clearly with structured formatting.`,
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
    <div className="space-y-3">
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
            aria-label={`${style.name}${isActive ? ' - Currently selected' : ''}`}
            aria-pressed={isActive}
            onClick={() => handleStyleClick(style, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`
              relative cursor-pointer transition-all duration-200
              ${isActive
                ? `border-2 ${colors.border} shadow-lg ${colors.shadow}`
                : 'border-slate-700 hover:border-slate-600'
              }
              hover:scale-[1.01] hover:shadow-md hover:-translate-y-0.5
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950
            `}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight mb-0.5">
                    {style.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {style.description}
                  </p>
                </div>
              </div>

              {isActive && (
                <div
                  className={`absolute top-3 right-3 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center animate-in zoom-in duration-200`}
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
