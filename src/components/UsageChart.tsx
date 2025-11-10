import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Separator } from './ui/Separator';
import { BarChart3, TrendingUp, FileDown, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Dot } from 'recharts';
import { supabase } from '../lib/supabase';
import { useLocation } from 'wouter';

interface ChartDataPoint {
  date: string;
  format_count: number;
  token_count: number;
}

interface UsageChartProps {
  data: ChartDataPoint[];
  loading: boolean;
  isPro: boolean;
  userId?: string;
}

interface WeeklyData {
  day: string;
  dayFull: string;
  count: number;
  date: string;
  styles?: { style_id: string; count: number }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-white mb-1">{data.dayFull}</p>
        <p className="text-xs text-emerald-400">
          {data.count} {data.count === 1 ? 'formatação' : 'formatações'}
        </p>
        {data.styles && data.styles.length > 0 && (
          <div className="mt-1 pt-1 border-t border-slate-700">
            {data.styles.map((style: any) => (
              <p key={style.style_id} className="text-xs text-slate-400">
                • {style.style_id === 'casual' ? 'Casual' : style.style_id === 'sales' ? 'Sales' : 'Official'}: {style.count}
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.count === 0) {
    return null;
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#10b981"
      stroke="#fff"
      strokeWidth={2}
      className="hover:r-6 transition-all"
    />
  );
};

export function UsageChart({ data, loading, isPro, userId }: UsageChartProps) {
  const [, setLocation] = useLocation();
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loadingWeekly, setLoadingWeekly] = useState(true);

  useEffect(() => {
    if (!isPro && userId) {
      fetchWeeklyData();
    }
  }, [isPro, userId]);

  const fetchWeeklyData = async () => {
    if (!userId) return;

    setLoadingWeekly(true);
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);

      const { data: historyData, error } = await supabase
        .from('formatting_history')
        .select('created_at, style_id')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const daysMap: Record<string, { count: number; styles: Record<string, number> }> = {};
      const last7Days = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        daysMap[dateStr] = { count: 0, styles: {} };
      }

      historyData?.forEach((item) => {
        const dateStr = item.created_at.split('T')[0];
        if (daysMap[dateStr]) {
          daysMap[dateStr].count++;
          const styleId = item.style_id || 'casual';
          daysMap[dateStr].styles[styleId] = (daysMap[dateStr].styles[styleId] || 0) + 1;
        }
      });

      const chartData: WeeklyData[] = last7Days.map((dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const dayShort = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayFull = date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });

        const styles = Object.entries(daysMap[dateStr].styles).map(([style_id, count]) => ({
          style_id,
          count,
        }));

        return {
          day: dayShort.charAt(0).toUpperCase() + dayShort.slice(1, 3),
          dayFull: dayFull.charAt(0).toUpperCase() + dayFull.slice(1),
          count: daysMap[dateStr].count,
          date: dateStr,
          styles: styles.length > 0 ? styles : undefined,
        };
      });

      setWeeklyData(chartData);
    } catch (error) {
      console.error('Error fetching weekly data:', error);
    } finally {
      setLoadingWeekly(false);
    }
  };

  if (!isPro) {
    const hasData = weeklyData.some((d) => d.count > 0);
    const totalFormats = weeklyData.reduce((sum, d) => sum + d.count, 0);

    if (loadingWeekly) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>📊 Gráfico de Uso</CardTitle>
            <CardDescription>Últimos 7 dias</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Gráfico de Uso
          </CardTitle>
          <CardDescription>
            Acompanhe sua atividade diária de formatação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasData ? (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis
                      dataKey="day"
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={12}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={<CustomDot />}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Esta semana:</span>
                <span className="text-white font-semibold">
                  {totalFormats} {totalFormats === 1 ? 'formatação' : 'formatações'}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-5xl mb-3 opacity-50">📊</div>
              <p className="text-slate-400 text-sm">
                Nenhuma atividade esta semana
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Comece a formatar para ver seu gráfico de uso!
              </p>
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-lg">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-white">Upgrade para Pro:</span>
            </div>

            <div className="space-y-2 pl-8">
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span>Análises detalhadas com tendências</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <BarChart3 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span>Gráficos de comparação por estilo</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span>Relatórios mensais e anuais</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <FileDown className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span>Exportar dados para CSV</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <Target className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-400" />
                <span>Insights e recomendações de uso</span>
              </div>
            </div>

            <Button
              onClick={() => setLocation('/pricing')}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all mt-3"
            >
              Fazer Upgrade para Pro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gráfico de Uso</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })
  }));

  const maxCount = data.length > 0 ? Math.max(...data.map(item => item.format_count)) : 1;
  const avgCount = data.length > 0
    ? data.reduce((sum, item) => sum + item.format_count, 0) / data.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gráfico de Uso</CardTitle>
            <CardDescription>
              Últimos 30 dias • Média: {avgCount.toFixed(1)} por dia
            </CardDescription>
          </div>
          <Badge className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border-emerald-500/30">
            Pro
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <div className="flex items-end justify-between h-full gap-1 px-2">
            {formattedData.map((item, index) => {
              const height = maxCount > 0 ? (item.format_count / maxCount) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-cyan-500 rounded-t hover:opacity-80 transition-opacity relative"
                    style={{ height: `${height}%`, minHeight: item.format_count > 0 ? '4px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.format_count}
                    </div>
                  </div>
                  {formattedData.length <= 15 && (
                    <span className="text-xs text-slate-500 mt-2 rotate-45 origin-left">
                      {item.date}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
