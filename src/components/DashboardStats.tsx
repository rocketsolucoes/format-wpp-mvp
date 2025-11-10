import React from 'react';
import { FileText, Crown, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { Button } from './ui/Button';
import { EnhancedCreditsCard } from './EnhancedCreditsCard';
import { FavoriteStyleCard } from './FavoriteStyleCard';
import { TimeSavedCard } from './TimeSavedCard';
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className={i === 1 ? 'md:col-span-2' : ''}>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <EnhancedCreditsCard user={user} onUpgradeClick={handleUpgradeClick} />

      <FavoriteStyleCard userId={user?.id} onTryOtherStyles={handleTryOtherStyles} />

      <TimeSavedCard userId={user?.id} />

      <Card className="hover:border-yellow-500/50 transition-colors">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Este Mês</span>
            <div className={`p-2 rounded-lg ${
              monthTrend >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              {monthTrend >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.this_month || 0}
          </div>
          <div className={`flex items-center gap-1 text-xs ${
            monthTrend >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {monthTrend >= 0 ? '+' : ''}{monthTrend.toFixed(1)}%
            <span className="text-slate-400">vs mês passado</span>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:border-emerald-500/50 transition-colors">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total de Formatações</span>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-white">
            {stats?.total_formatting || 0}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Uso total</span>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:border-blue-500/50 transition-colors">
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Plano Atual</span>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Crown className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-white capitalize">
              {user?.plan === 'pro' ? 'Pro' : user?.plan === 'free' ? 'Gratuito' : user?.plan || 'Gratuito'}
            </span>
            <Badge variant={user?.plan === 'free' ? 'default' : 'success'}>
              {user?.plan === 'free' ? 'Limitado' : 'Ativo'}
            </Badge>
          </div>
          {user?.plan === 'free' ? (
            <Button
              variant="outline"
              className="w-full text-xs py-1.5"
              onClick={handleUpgradeClick}
            >
              Fazer Upgrade
            </Button>
          ) : (
            <div className="text-xs text-slate-400">
              {user?.plan === 'pro' ? 'R$ 49,90/mês' : 'Preço personalizado'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
