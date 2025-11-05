import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { Badge } from './ui/Badge';

interface ChartDataPoint {
  date: string;
  count: number;
}

interface UsageChartProps {
  data: ChartDataPoint[];
  loading: boolean;
  isPro: boolean;
}

export function UsageChart({ data, loading, isPro }: UsageChartProps) {
  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usage Chart</CardTitle>
              <CardDescription>Track your daily formatting activity</CardDescription>
            </div>
            <Badge variant="info">Pro Feature</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-slate-400 mb-4">
              Upgrade to Pro to unlock detailed usage analytics
            </p>
            <button
              onClick={() => window.location.href = '/pricing'}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-sm font-semibold hover:scale-105 transition-transform"
            >
              Upgrade to Pro
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Chart</CardTitle>
          <CardDescription>Last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const formattedData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const maxCount = data.length > 0 ? Math.max(...data.map(item => item.count)) : 1;
  const avgCount = data.length > 0
    ? data.reduce((sum, item) => sum + item.count, 0) / data.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Chart</CardTitle>
        <CardDescription>
          Last 30 days • Average: {avgCount.toFixed(1)} per day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <div className="flex items-end justify-between h-full gap-1 px-2">
            {formattedData.map((item, index) => {
              const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500 to-cyan-500 rounded-t hover:opacity-80 transition-opacity relative"
                    style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {item.count}
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
