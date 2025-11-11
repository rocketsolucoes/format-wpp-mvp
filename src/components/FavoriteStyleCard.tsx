import React, { useState, useEffect } from 'react';
import { Star, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Skeleton } from './ui/Skeleton';
import { Tooltip } from './ui/Tooltip';
import { supabase } from '../lib/supabase';

interface StyleStats {
  style_id: string;
  count: number;
  percentage: number;
}

interface FavoriteStyleCardProps {
  userId: string;
  onTryOtherStyles: () => void;
}

const styleConfig = {
  casual: {
    emoji: '😊',
    name: 'Casual',
    subtitle: 'Amigável',
    color: 'emerald',
  },
  sales: {
    emoji: '🔥',
    name: 'Sales',
    subtitle: 'Persuasivo',
    color: 'orange',
  },
  announcement: {
    emoji: '📢',
    name: 'Official',
    subtitle: 'Anúncio',
    color: 'blue',
  },
};

export function FavoriteStyleCard({ userId, onTryOtherStyles }: FavoriteStyleCardProps) {
  const [loading, setLoading] = useState(true);
  const [styleStats, setStyleStats] = useState<StyleStats[]>([]);
  const [favoriteStyle, setFavoriteStyle] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchFavoriteStyle();
  }, [userId]);

  const fetchFavoriteStyle = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('formatting_history')
        .select('style_id')
        .eq('user_id', userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        setTotalCount(0);
        setFavoriteStyle(null);
        setStyleStats([]);
        return;
      }

      const styleCounts: Record<string, number> = {
        casual: 0,
        sales: 0,
        announcement: 0,
      };

      data.forEach((item) => {
        const styleId = item.style_id || 'casual';
        if (styleCounts[styleId] !== undefined) {
          styleCounts[styleId]++;
        }
      });

      const total = data.length;
      setTotalCount(total);

      const stats: StyleStats[] = Object.entries(styleCounts)
        .map(([style_id, count]) => ({
          style_id,
          count,
          percentage: (count / total) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      setStyleStats(stats);

      if (stats[0].count > 0) {
        const topCount = stats[0].count;
        const tiedStyles = stats.filter((s) => s.count === topCount);

        if (tiedStyles.length > 1 && topCount > 0) {
          setFavoriteStyle('mixed');
        } else {
          setFavoriteStyle(stats[0].style_id);
        }
      } else {
        setFavoriteStyle(null);
      }
    } catch (error) {
      console.error('Error fetching favorite style:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="hover:border-yellow-500/50 transition-colors">
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-20 mx-auto" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!favoriteStyle || totalCount === 0) {
    return (
      <Card className="hover:border-yellow-500/50 transition-colors border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <CardContent className="space-y-3 text-center">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Estilo Favorito</span>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <Sparkles className="w-10 h-10 mx-auto text-yellow-400" />
            <div>
              <div className="text-xl font-bold text-white">Sem favorito</div>
              <p className="text-xs text-slate-400">Comece a formatar</p>
            </div>
          </div>
          <div className="text-center pt-1">
            <span className="text-2xl font-bold text-white">0</span>
            <span className="text-xs text-slate-500 block">formatos</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favoriteStyle === 'mixed') {
    return (
      <Card className="hover:border-yellow-500/50 transition-colors border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
        <CardContent className="space-y-3 text-center">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Estilo Favorito</span>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-4xl">🎭</div>
            <div>
              <div className="text-xl font-bold text-white">Uso Misto</div>
              <p className="text-xs text-slate-400">Vários estilos</p>
            </div>
          </div>
          <div className="text-center pt-1">
            <span className="text-2xl font-bold text-white">{totalCount}</span>
            <span className="text-xs text-slate-500 block">
              {totalCount === 1 ? 'formato' : 'formatos'}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = styleConfig[favoriteStyle as keyof typeof styleConfig];
  const favoriteStats = styleStats.find((s) => s.style_id === favoriteStyle);

  const colorClasses = {
    emerald: 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5',
    orange: 'border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-red-500/5',
    blue: 'border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-cyan-500/5',
  };

  const iconColorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    orange: 'bg-orange-500/10 text-orange-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <Card className={`hover:border-yellow-500/50 transition-colors ${colorClasses[config.color as keyof typeof colorClasses]}`}>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Estilo Favorito</span>
          <div className={`p-2 rounded-lg ${iconColorClasses[config.color as keyof typeof iconColorClasses]}`}>
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <Tooltip content={`${config.name} - ${config.subtitle}`} side="top">
            <div className="text-4xl cursor-help">{config.emoji}</div>
          </Tooltip>
          <div>
            <div className="text-xl font-bold text-white">{config.name}</div>
            <p className="text-xs text-slate-400">{config.subtitle}</p>
          </div>
        </div>

        <div className="text-center pt-1">
          <span className="text-2xl font-bold text-white">
            {favoriteStats?.count}
          </span>
          <span className="text-xs text-slate-500 block">
            {favoriteStats?.count === 1 ? 'vez' : 'vezes'} ({favoriteStats?.percentage.toFixed(0)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
