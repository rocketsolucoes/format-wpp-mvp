import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { supabase } from '../lib/supabase';
import { Grid3x3, TrendingUp, Calendar } from 'lucide-react';

interface ActivityHeatmapProps {
  userId: string;
  isPro: boolean;
  className?: string;
}

interface DayActivity {
  date: string;
  count: number;
  weekday: number;
  week: number;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ActivityHeatmap({ userId, isPro, className = '' }: ActivityHeatmapProps) {
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<DayActivity[]>([]);
  const [maxCount, setMaxCount] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [activeDays, setActiveDays] = useState(0);

  useEffect(() => {
    if (isPro && userId) {
      fetchHeatmapData();
    }
  }, [isPro, userId]);

  const fetchHeatmapData = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const daysToShow = 28;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToShow);

      const { data, error } = await supabase
        .from('formatting_history')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const dayCounts: Record<string, number> = {};

      data?.forEach((item) => {
        const date = item.created_at.split('T')[0];
        dayCounts[date] = (dayCounts[date] || 0) + 1;
      });

      const heatmap: DayActivity[] = [];
      let max = 0;
      let active = 0;

      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = dayCounts[dateStr] || 0;

        if (count > 0) active++;
        if (count > max) max = count;

        heatmap.push({
          date: dateStr,
          count,
          weekday: date.getDay(),
          week: Math.floor(i / 7),
        });
      }

      setHeatmapData(heatmap);
      setMaxCount(max);
      setTotalDays(daysToShow);
      setActiveDays(active);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (count: number) => {
    if (count === 0) return 'bg-slate-800/50';
    const intensity = Math.min(count / maxCount, 1);
    if (intensity <= 0.25) return 'bg-emerald-500/20';
    if (intensity <= 0.5) return 'bg-emerald-500/40';
    if (intensity <= 0.75) return 'bg-emerald-500/60';
    return 'bg-emerald-500/80';
  };

  if (!isPro) {
    return null;
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Mapa de Atividade</CardTitle>
          <CardDescription>Últimas 4 semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const weeks = Math.ceil(heatmapData.length / 7);
  const consistencyRate = totalDays > 0 ? (activeDays / totalDays) * 100 : 0;

  if (activeDays < 10) {
    return (
      <Card className={`bg-blue-900/10 border-blue-500/20 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Continue Formatando!</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Seu mapa de atividade aparecerá aqui após 10 dias de uso.
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-400">{activeDays}</span>
                <span className="text-slate-500">/</span>
                <span className="text-lg text-slate-400">10 dias</span>
              </div>
              <div className="w-full max-w-xs mx-auto h-3 bg-slate-800/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${(activeDays / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-cyan-400" />
          Mapa de Atividade
        </CardTitle>
        <CardDescription>
          Padrão de uso nas últimas 4 semanas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex gap-1">
            <div className="w-8"></div>
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                  const dataIndex = weekIndex * 7 + dayIndex;
                  const dayData = heatmapData[dataIndex];

                  if (!dayData) {
                    return <div key={dayIndex} className="w-3 h-3" />;
                  }

                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(dayData.count)} hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer group relative`}
                      title={`${new Date(dayData.date).toLocaleDateString('pt-BR')}: ${dayData.count} formatações`}
                    >
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        {new Date(dayData.date).toLocaleDateString('pt-BR')}
                        <br />
                        {dayData.count} {dayData.count === 1 ? 'formatação' : 'formatações'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex gap-1 text-xs text-slate-500">
            <div className="w-8"></div>
            {WEEKDAYS.map((day, index) => (
              <div key={index} className="w-3 text-center" style={{ writingMode: 'vertical-rl', fontSize: '8px' }}>
                {day}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Menos</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-800/50" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
            </div>
            <span className="text-slate-400">Mais</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <p className="text-xs text-slate-400">Taxa de consistência</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{consistencyRate.toFixed(0)}%</p>
            <p className="text-xs text-cyan-400">
              {activeDays} de {totalDays} dias ativos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
