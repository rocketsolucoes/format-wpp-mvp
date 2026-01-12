import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { supabase } from '../lib/supabase';
import { Grid3x3, TrendingUp, Calendar } from 'lucide-react';

interface ActivityHeatmapProps {
  userId: string;
  isPro: boolean;
}

interface DayActivity {
  date: string;
  count: number;
  weekday: number;
  week: number;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function ActivityHeatmap({ userId, isPro }: ActivityHeatmapProps) {
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
      const daysToShow = 42;
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
        // Usar data local ao invés de UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
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
    if (count === 0) return 'bg-muted/50';
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
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Atividade</CardTitle>
          <CardDescription>Últimas 6 semanas</CardDescription>
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
      <Card className="bg-blue-900/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Continue Formatando!</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Seu mapa de atividade aparecerá aqui após 10 dias de uso.
              </p>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold text-blue-400">{activeDays}</span>
                <span className="text-slate-500">/</span>
                <span className="text-lg text-muted-foreground">10 dias</span>
              </div>
              <div className="w-full max-w-xs mx-auto h-3 bg-muted/50 rounded-full overflow-hidden">
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

  // Organizar dados por dia da semana (0-6) e semana
  const dataByWeekday: Record<number, DayActivity[]> = {
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  };

  heatmapData.forEach(day => {
    dataByWeekday[day.weekday].push(day);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-cyan-400" />
          Mapa de Atividade
        </CardTitle>
        <CardDescription>
          Padrão de uso nas últimas 6 semanas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Container flex para gráfico e taxa de consistência lado a lado */}
        <div className="flex gap-6 items-start">
          {/* Gráfico de atividade */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              {/* Renderizar cada dia da semana como uma linha horizontal */}
              {[0, 1, 2, 3, 4, 5, 6].map((weekdayIndex) => (
                <div key={weekdayIndex} className="flex items-center gap-1">
                  {/* Label do dia da semana */}
                  <div className="w-8 text-xs text-muted-foreground text-right pr-2">
                    {WEEKDAYS[weekdayIndex]}
                  </div>
                  
                  {/* Células de atividade para este dia da semana */}
                  <div className="flex gap-1">
                    {Array.from({ length: weeks }).map((_, weekIndex) => {
                      const dayData = dataByWeekday[weekdayIndex][weekIndex];

                      if (!dayData) {
                        return <div key={weekIndex} className="w-3 h-3" />;
                      }

                      return (
                        <div
                          key={weekIndex}
                          className={`w-3 h-3 rounded-sm ${getIntensityColor(dayData.count)} hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer group relative`}
                          title={`${dayData.date.split('-').reverse().join('/')}: ${dayData.count} formatações`}
                        >
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-card border border-border text-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                            {(() => {
                              const [year, month, day] = dayData.date.split('-');
                              return `${day}/${month}/${year}`;
                            })()}
                            <br />
                            {dayData.count} {dayData.count === 1 ? 'formatação' : 'formatações'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Legenda */}
            <div className="flex items-center gap-2 text-xs pt-2">
              <span className="text-muted-foreground">Menos</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted/50" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                <div className="w-3 h-3 rounded-sm bg-emerald-500/80" />
              </div>
              <span className="text-muted-foreground">Mais</span>
            </div>
          </div>

          {/* Taxa de consistência - ao lado direito */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 rounded-lg p-4 min-w-[180px] flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <p className="text-xs text-muted-foreground">Taxa de consistência</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-foreground">{consistencyRate.toFixed(0)}%</p>
              <p className="text-xs text-cyan-400">
                {activeDays} de {totalDays} dias ativos
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
