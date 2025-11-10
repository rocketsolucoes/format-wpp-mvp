import React, { useState, useEffect } from 'react';
import { Zap, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { supabase } from '../lib/supabase';

interface TimeSavedCardProps {
  userId: string;
}

const TIME_PER_STYLE = {
  casual: 2,
  sales: 4,
  announcement: 3,
};

const MOTIVATIONAL_MESSAGES = [
  { max: 10, message: 'Todo segundo conta! 🚀', color: 'text-slate-400' },
  { max: 30, message: 'Ótimo progresso! ⚡', color: 'text-emerald-400' },
  { max: 60, message: 'Você está em chamas! 🔥', color: 'text-orange-400' },
  { max: Infinity, message: 'Campeão de economia! 👑', color: 'text-yellow-400' },
];

export function TimeSavedCard({ userId }: TimeSavedCardProps) {
  const [loading, setLoading] = useState(true);
  const [thisMonthMinutes, setThisMonthMinutes] = useState(0);
  const [lastMonthMinutes, setLastMonthMinutes] = useState(0);
  const [thisMonthCount, setThisMonthCount] = useState(0);
  const [avgTimePerFormat, setAvgTimePerFormat] = useState(3);

  useEffect(() => {
    fetchTimeSaved();
  }, [userId]);

  const fetchTimeSaved = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      const [thisMonthResult, lastMonthResult] = await Promise.all([
        supabase
          .from('formatting_history')
          .select('style_id')
          .eq('user_id', userId)
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('formatting_history')
          .select('style_id')
          .eq('user_id', userId)
          .gte('created_at', startOfLastMonth.toISOString())
          .lte('created_at', endOfLastMonth.toISOString()),
      ]);

      if (thisMonthResult.error) throw thisMonthResult.error;
      if (lastMonthResult.error) throw lastMonthResult.error;

      const calculateTime = (data: any[]) => {
        let totalTime = 0;
        data.forEach((item) => {
          const styleId = item.style_id || 'casual';
          const time = TIME_PER_STYLE[styleId as keyof typeof TIME_PER_STYLE] || 3;
          totalTime += time;
        });
        return totalTime;
      };

      const thisMonthTime = calculateTime(thisMonthResult.data || []);
      const lastMonthTime = calculateTime(lastMonthResult.data || []);

      setThisMonthMinutes(thisMonthTime);
      setLastMonthMinutes(lastMonthTime);
      setThisMonthCount(thisMonthResult.data?.length || 0);

      if (thisMonthResult.data && thisMonthResult.data.length > 0) {
        const avg = thisMonthTime / thisMonthResult.data.length;
        setAvgTimePerFormat(Math.round(avg));
      }
    } catch (error) {
      console.error('Error fetching time saved:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${mins}m`;
    }
    return `${minutes} min`;
  };

  const getMotivationalMessage = (minutes: number) => {
    const message = MOTIVATIONAL_MESSAGES.find((m) => minutes <= m.max);
    return message || MOTIVATIONAL_MESSAGES[MOTIVATIONAL_MESSAGES.length - 1];
  };

  const timeDifference = thisMonthMinutes - lastMonthMinutes;
  const hasComparison = lastMonthMinutes > 0;
  const motivational = getMotivationalMessage(thisMonthMinutes);

  if (loading) {
    return (
      <Card className="hover:border-cyan-500/50 transition-colors">
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    );
  }

  if (thisMonthMinutes === 0) {
    return (
      <Card className="hover:border-cyan-500/50 transition-colors border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <CardContent className="space-y-3 text-center">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Tempo Economizado</span>
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="flex items-center justify-center my-2">
            <Clock className="w-12 h-12 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white">~0 min</div>
          <p className="text-xs text-slate-400">
            Comece a formatar para economizar tempo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:border-cyan-500/50 transition-colors border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Tempo Economizado</span>
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Zap className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-cyan-400">
            ~{formatTime(thisMonthMinutes)}
          </div>
          <p className="text-xs text-slate-500 mt-1">este mês</p>
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Média por formato:</span>
            <span className="text-slate-300">{avgTimePerFormat} min</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Total de formatos:</span>
            <span className="text-slate-300">{thisMonthCount}</span>
          </div>
        </div>

        {hasComparison && (
          <div className={`flex items-center justify-center gap-1 text-xs ${
            timeDifference > 0 ? 'text-emerald-400' : timeDifference < 0 ? 'text-red-400' : 'text-slate-400'
          }`}>
            {timeDifference > 0 ? (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>+{formatTime(Math.abs(timeDifference))} vs mês passado</span>
              </>
            ) : timeDifference < 0 ? (
              <>
                <TrendingDown className="w-3 h-3" />
                <span>-{formatTime(Math.abs(timeDifference))} vs mês passado</span>
              </>
            ) : (
              <span>Igual ao mês passado</span>
            )}
          </div>
        )}

        <div className={`text-center text-xs font-medium ${motivational.color}`}>
          {motivational.message}
        </div>
      </CardContent>
    </Card>
  );
}
