import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, Search, BookOpen, Zap } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardStats } from '../components/DashboardStats';
import { RecentFormatting } from '../components/RecentFormatting';
import { UsageChart } from '../components/UsageChart';
import { StyleDistributionChart } from '../components/StyleDistributionChart';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';
import { StyleSelectionCard } from '../components/StyleSelectionCard';
import { StyleComparisonModal } from '../components/StyleComparisonModal';
import { StyleExamplesModal } from '../components/StyleExamplesModal';

interface StatsData {
  total_formatting: number;
  this_month: number;
  last_month: number;
  total_tokens: number;
  avg_tokens: number;
  favorite_style_id?: string;
  favorite_style_name?: string;
}

interface FormattingItem {
  id: string;
  input_text: string;
  output_text: string;
  created_at: string;
  style_id?: string;
  is_favorite?: boolean;
}

interface ChartDataPoint {
  date: string;
  format_count: number;
  token_count: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentItems, setRecentItems] = useState<FormattingItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [examplesModalOpen, setExamplesModalOpen] = useState(false);
  const [lastUsedStyle, setLastUsedStyle] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [statsResult, historyResult, chartResult] = await Promise.all([
        supabase.rpc('get_user_stats', { p_user_id: user.id }),
        supabase
          .from('formatting_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        user.plan !== 'free'
          ? supabase.rpc('get_daily_usage', { p_user_id: user.id })
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (statsResult.error) throw statsResult.error;
      if (historyResult.error) throw historyResult.error;
      if (chartResult.error) throw chartResult.error;

      setStats(Array.isArray(statsResult.data) ? statsResult.data[0] : statsResult.data);
      setRecentItems(historyResult.data || []);
      setChartData(chartResult.data || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const savedStyle = localStorage.getItem('lastUsedStyle');
    setLastUsedStyle(savedStyle);
  }, [user]);

  const handleStyleSelect = (styleId: string, styleName: string) => {
    localStorage.setItem('selectedStyle', styleId);
    localStorage.setItem('lastUsedStyle', styleId);
    setLocation('/format');
  };

  const handleQuickFormat = () => {
    const style = lastUsedStyle || 'casual';
    localStorage.setItem('selectedStyle', style);
    setLocation('/format');
  };

  return (
    <DashboardLayout>
      <div className="px-4 py-4 sm:px-6 lg:px-8 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Painel</h1>
            <p className="text-sm text-slate-400">Bem-vindo de volta, {user?.full_name || 'Usuário'}!</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8 space-y-8">
          {error && (
            <Alert variant="danger">
              <AlertDescription>
                {error}
                <button
                  onClick={fetchDashboardData}
                  className="ml-2 underline hover:no-underline"
                >
                  Tentar novamente
                </button>
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-4">
            <h2 className="text-base font-bold mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              ✨ Escolha um Estilo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <StyleSelectionCard
                styleId="casual"
                icon="😊"
                title="Casual"
                subtitle="Amigável"
                description=""
                exampleBadge=""
                accentColor="emerald"
                isLastUsed={lastUsedStyle === 'casual'}
                onSelect={() => handleStyleSelect('casual', 'Casual')}
                compact={true}
              />
              <StyleSelectionCard
                styleId="sales"
                icon="🔥"
                title="Sales"
                subtitle="Persuasivo"
                description=""
                exampleBadge=""
                accentColor="orange"
                isLastUsed={lastUsedStyle === 'sales'}
                onSelect={() => handleStyleSelect('sales', 'Sales')}
                compact={true}
              />
              <StyleSelectionCard
                styleId="announcement"
                icon="📢"
                title="Official"
                subtitle="Anúncio"
                description=""
                exampleBadge=""
                accentColor="blue"
                isLastUsed={lastUsedStyle === 'announcement'}
                onSelect={() => handleStyleSelect('announcement', 'Official')}
                compact={true}
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <button
                onClick={() => setComparisonModalOpen(true)}
                className="text-slate-500 hover:text-emerald-400 transition-colors"
              >
                Comparar estilos
              </button>
              <span className="text-slate-700">|</span>
              <button
                onClick={() => setExamplesModalOpen(true)}
                className="text-slate-500 hover:text-emerald-400 transition-colors"
              >
                Ver exemplos
              </button>
            </div>
          </div>

          <DashboardStats stats={stats} loading={loading} user={user} />

          <div className="space-y-6">
            {user?.plan !== 'free' && (
              <UsageChart
                data={chartData}
                loading={loading}
                isPro={true}
                userId={user?.id}
              />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentFormatting items={recentItems} loading={loading} onRefresh={fetchDashboardData} />
              </div>
              <div className="space-y-6">
                {user?.plan === 'free' && (
                  <UsageChart
                    data={chartData}
                    loading={loading}
                    isPro={false}
                    userId={user?.id}
                  />
                )}
                {user?.plan !== 'free' && (
                  <>
                    <StyleDistributionChart userId={user?.id || ''} isPro={true} />
                    <ActivityHeatmap userId={user?.id || ''} isPro={true} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <StyleComparisonModal
          open={comparisonModalOpen}
          onOpenChange={setComparisonModalOpen}
        />

        <StyleExamplesModal
          open={examplesModalOpen}
          onOpenChange={setExamplesModalOpen}
        />
    </DashboardLayout>
  );
};

export default Dashboard;
