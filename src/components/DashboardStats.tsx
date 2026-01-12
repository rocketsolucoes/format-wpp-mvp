import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { EnhancedCreditsCard } from './EnhancedCreditsCard';
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

  const avgPerWeek = stats ? Math.round(stats.this_month / 4) : 0;

  const isFreePlan = user?.plan === 'free';

  if (loading) {
    if (!isFreePlan) {
      return null;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isFreePlan) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <EnhancedCreditsCard user={user} onUpgradeClick={handleUpgradeClick} />

      <Card className="hover:border-blue-500/50 transition-colors h-full">
        <CardContent className="space-y-4 h-full flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Atividade Recente</span>
            <div className={`p-2 rounded-lg ${
              monthTrend >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'
            }`}>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Este mês</span>
              <span className="text-2xl font-bold text-white">
                {stats?.this_month || 0}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold text-muted-foreground">
                {stats?.total_formatting || 0}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
              <span className="text-xs text-slate-500">Média semanal</span>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-muted-foreground">{avgPerWeek}</span>
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
