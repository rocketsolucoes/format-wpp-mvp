import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { Palette } from 'lucide-react';

interface StyleDistributionProps {
  userId: string;
  isPro: boolean;
}

interface StyleData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

const STYLE_COLORS = {
  casual: '#10b981',
  sales: '#f97316',
  announcement: '#3b82f6',
};

const STYLE_NAMES = {
  casual: 'Casual',
  sales: 'Sales',
  announcement: 'Official',
};

const STYLE_ICONS = {
  casual: '😊',
  sales: '🔥',
  announcement: '📢',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-3 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{data.payload.icon}</span>
          <p className="text-sm font-semibold text-white">{data.name}</p>
        </div>
        <p className="text-xs text-slate-400">
          {data.value} formatações ({((data.value / data.payload.total) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export function StyleDistributionChart({ userId, isPro }: StyleDistributionProps) {
  const [loading, setLoading] = useState(true);
  const [styleData, setStyleData] = useState<StyleData[]>([]);
  const [totalFormats, setTotalFormats] = useState(0);

  useEffect(() => {
    if (isPro && userId) {
      fetchStyleDistribution();
    }
  }, [isPro, userId]);

  const fetchStyleDistribution = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('formatting_history')
        .select('style_id')
        .eq('user_id', userId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const styleCounts: Record<string, number> = {
        casual: 0,
        sales: 0,
        announcement: 0,
      };

      data?.forEach((item) => {
        const styleId = item.style_id || 'casual';
        if (styleCounts[styleId] !== undefined) {
          styleCounts[styleId]++;
        }
      });

      const total = Object.values(styleCounts).reduce((sum, count) => sum + count, 0);
      setTotalFormats(total);

      const chartData: StyleData[] = Object.entries(styleCounts)
        .map(([styleId, count]) => ({
          name: STYLE_NAMES[styleId as keyof typeof STYLE_NAMES],
          value: count,
          color: STYLE_COLORS[styleId as keyof typeof STYLE_COLORS],
          icon: STYLE_ICONS[styleId as keyof typeof STYLE_ICONS],
          total,
        }))
        .filter((item) => item.value > 0);

      setStyleData(chartData);
    } catch (error) {
      console.error('Error fetching style distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Estilo</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (styleData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            Distribuição por Estilo
          </CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-5xl mb-3 opacity-50">📊</div>
            <p className="text-slate-400 text-sm">
              Nenhuma formatação nos últimos 30 dias
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mostUsedStyle = styleData.reduce((max, item) =>
    item.value > max.value ? item : max, styleData[0]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          Distribuição por Estilo
        </CardTitle>
        <CardDescription>
          Análise dos últimos 30 dias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={styleData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={5}
                dataKey="value"
                animationDuration={800}
              >
                {styleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          {styleData.map((style) => {
            const percentage = (style.value / totalFormats) * 100;
            return (
              <div key={style.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{style.icon}</span>
                  <span className="text-slate-400">{style.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{style.value}</span>
                  <span className="text-slate-500 text-xs">({percentage.toFixed(0)}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 mt-4">
          <p className="text-xs text-slate-400 mb-1">Estilo favorito</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mostUsedStyle.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm">{mostUsedStyle.name}</p>
              <p className="text-purple-400 text-xs">
                {((mostUsedStyle.value / totalFormats) * 100).toFixed(0)}% do uso total
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
