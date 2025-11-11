import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { EnhancedCreditsCard } from './EnhancedCreditsCard';
import { FavoriteStyleCard } from './FavoriteStyleCard';
import { useLocation } from 'wouter';

interface StatsData {
  total_formatting: number;
  this_month: number;
  last_month: number;
}

interface DashboardStatsProps {
  stats: StatsData | null;
  loading: boolean;
  user: any;
}

export function DashboardStats({ stats, loading, user }: DashboardStatsProps) {
  const [, setLocation] = useLocation();

  const monthTrend = stats && stats.last_month > 0
    ? ((stats.this_month - stats.last_month) / stats.last_month) * 100
    : 0;

  const handleUpgradeClick = () => {
    setLocation('/pricing');
  };

  const handleTryOtherStyles = () => {
    setLocation('/format');
  };

  const avgPerWeek = stats ? Math.round(stats.this_month / 4) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-6">
          <Card>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-3">
        <EnhancedCreditsCard user={user} onUpgradeClick={handleUpgradeClick} />
      </div>

      <div className="lg:col-span-6">
        <FavoriteStyleCard userId={user?.id} onTryOtherStyles={handleTryOtherStyles} />
      </div>

      <Card className="hover:border-blue-500/50 transition-colors lg:col-span-1">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Atividade Recente</span>
            <div className={`p-2 rounded-lg ${
              monthTrend >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'
            }`}>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Este mês</span>
              <span className="text-2xl font-bold text-white">
                {stats?.this_month || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Total</span>
              <span className="text-lg font-semibold text-slate-300">
                {stats?.total_formatting || 0}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
              <span className="text-xs text-slate-500">Média semanal</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-slate-300">{avgPerWeek}</span>
                {monthTrend >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
