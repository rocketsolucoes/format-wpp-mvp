import React, { useState, useEffect } from 'react';
import { Coins, Calendar, ChevronDown, ChevronUp, AlertTriangle, Sparkles, BarChart2, Star } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Button } from './ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/Collapsible';
import { Tooltip } from './ui/Tooltip';
import { Badge } from './ui/Badge';
import { supabase } from '../lib/supabase';

interface StyleUsage {
  style_id: string;
  style_name: string;
  format_count: number;
  credits_used: number;
}

interface EnhancedCreditsCardProps {
  user: any;
  onUpgradeClick: () => void;
}

export function EnhancedCreditsCard({ user, onUpgradeClick }: EnhancedCreditsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [styleUsage, setStyleUsage] = useState<StyleUsage[]>([]);
  const [loading, setLoading] = useState(false);

  const isPro = user?.plan === 'pro';
  const creditsRemaining = user?.credits_remaining || 0;
  const totalCredits = 30;
  const percentage = (creditsRemaining / totalCredits) * 100;

  const calculateDaysUntilReset = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();

    let nextReset = new Date(created);
    nextReset.setMonth(nextReset.getMonth() + 1);

    while (nextReset < now) {
      nextReset.setMonth(nextReset.getMonth() + 1);
    }

    const diffTime = nextReset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const formatResetDate = (createdAt: string): string => {
    const created = new Date(createdAt);
    const now = new Date();

    let nextReset = new Date(created);
    nextReset.setMonth(nextReset.getMonth() + 1);

    while (nextReset < now) {
      nextReset.setMonth(nextReset.getMonth() + 1);
    }

    return nextReset.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const daysUntilReset = user?.created_at ? calculateDaysUntilReset(user.created_at) : 0;
  const resetDate = user?.created_at ? formatResetDate(user.created_at) : 'Desconhecido';

  const getColorByPercentage = (pct: number) => {
    if (pct >= 50) return {
      bar: 'bg-green-500',
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      icon: 'text-green-400'
    };
    if (pct >= 20) return {
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'text-amber-400'
    };
    return {
      bar: 'bg-red-500',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      icon: 'text-red-400'
    };
  };

  const getCreditMessage = (pct: number, remaining: number) => {
    if (pct >= 50) return `Você tem ${remaining} créditos disponíveis`;
    if (pct >= 20) return `Você tem ${remaining} créditos restantes`;
    return `Atenção! Apenas ${remaining} ${remaining === 1 ? 'crédito restante' : 'créditos restantes'}`;
  };

  const colors = getColorByPercentage(percentage);

  const fetchStyleUsage = async () => {
    if (!user?.id || isPro) return;

    setLoading(true);
    try {
      const startOfPeriod = new Date(user.created_at);
      const now = new Date();

      let periodStart = new Date(startOfPeriod);
      while (periodStart < now) {
        const nextPeriod = new Date(periodStart);
        nextPeriod.setMonth(nextPeriod.getMonth() + 1);

        if (nextPeriod > now) break;
        periodStart = nextPeriod;
      }

      const { data, error } = await supabase
        .from('formatting_history')
        .select('style_id')
        .eq('user_id', user.id)
        .gte('created_at', periodStart.toISOString());

      if (error) throw error;

      const styleMap: Record<string, { name: string; count: number }> = {
        'casual': { name: 'Casual', count: 0 },
        'sales': { name: 'Sales', count: 0 },
        'announcement': { name: 'Official', count: 0 }
      };

      data?.forEach((item) => {
        const styleId = item.style_id || 'casual';
        if (styleMap[styleId]) {
          styleMap[styleId].count++;
        }
      });

      const usage: StyleUsage[] = Object.entries(styleMap).map(([id, info]) => ({
        style_id: id,
        style_name: info.name,
        format_count: info.count,
        credits_used: info.count
      }));

      setStyleUsage(usage);
    } catch (error) {
      console.error('Error fetching style usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded && !isPro) {
      fetchStyleUsage();
    }
  }, [isExpanded, user?.id, isPro]);

  if (isPro) {
    return (
      <Card className="hover:border-cyan-500/50 transition-colors border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5">
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Créditos</span>
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg">
              <Coins className="w-5 h-5 text-cyan-400" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text">
              ∞
            </div>
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-400 border-cyan-500/30">
              Ilimitado
            </Badge>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex items-start gap-2 text-sm text-emerald-400">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Formatação ilimitada</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-emerald-400">
              <BarChart2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Análises avançadas</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-emerald-400">
              <Star className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Salvar favoritos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`hover:border-cyan-500/50 transition-colors ${colors.border}`}>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Créditos</span>
            <Tooltip content="Você ganha 30 créditos novos todo mês. Cada formatação consome 1 crédito. Faça upgrade para créditos ilimitados!">
              <div className="w-4 h-4 rounded-full bg-slate-700/50 flex items-center justify-center cursor-help hover:bg-slate-700 transition-colors">
                <span className="text-xs text-slate-400">?</span>
              </div>
            </Tooltip>
          </div>
          <div className={`p-2 ${colors.bg} rounded-lg`}>
            <Coins className={`w-5 h-5 ${colors.icon}`} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {getCreditMessage(percentage, creditsRemaining)}
            </span>
            <span className="text-sm font-semibold text-slate-300">
              {creditsRemaining}/{totalCredits}
            </span>
          </div>

          <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bar} transition-all duration-300 ease-out rounded-full`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            {percentage < 20 && (
              <div className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Créditos baixos</span>
              </div>
            )}
          </div>
        </div>

        <Tooltip content={`Renova em ${resetDate}`} side="right">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>
              Renova em {daysUntilReset} {daysUntilReset === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </Tooltip>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors">
              <span className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Uso neste período
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-2 pt-2">
            {loading ? (
              <div className="text-xs text-slate-500 text-center py-2">
                Carregando...
              </div>
            ) : styleUsage.length > 0 ? (
              <div className="space-y-1.5 pl-6">
                {styleUsage.map((style) => (
                  <div
                    key={style.style_id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-400">
                      • {style.style_name}:
                    </span>
                    <span className="text-slate-300">
                      {style.format_count} {style.format_count === 1 ? 'formato' : 'formatos'}
                      ({style.credits_used} {style.credits_used === 1 ? 'crédito' : 'créditos'})
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">
                Nenhum uso registrado neste período
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {percentage < 30 && (
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 text-slate-400">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Formatação ilimitada</span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <BarChart2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Análises avançadas</span>
              </div>
              <div className="flex items-start gap-2 text-slate-400">
                <Star className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Salvar favoritos</span>
              </div>
            </div>

            <Button
              onClick={onUpgradeClick}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-105"
            >
              Fazer Upgrade para Pro
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
