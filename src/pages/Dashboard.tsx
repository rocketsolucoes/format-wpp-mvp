import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { DashboardStats } from '../components/DashboardStats';
import { RecentFormatting } from '../components/RecentFormatting';
import { UsageChart } from '../components/UsageChart';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription } from '../components/ui/Alert';

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
  }, [user]);

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

          <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Pronto para Formatar?
            </h2>
            <p className="text-slate-400 mb-4">
              Transforme suas mensagens com formatação por IA
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => setLocation('/format')}
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Começar a Formatar
              </Button>
            </div>
          </div>

          <DashboardStats stats={stats} loading={loading} user={user} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentFormatting items={recentItems} loading={loading} onRefresh={fetchDashboardData} />
            </div>
            <div className="space-y-6">
              <UsageChart
                data={chartData}
                loading={loading}
                isPro={user?.plan !== 'free'}
              />
            </div>
          </div>
        </div>
    </DashboardLayout>
  );
};

export default Dashboard;
