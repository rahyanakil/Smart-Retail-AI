'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { analyticsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useChartColors } from '@/hooks/useChartColors';
import type { ChartDataPoint, TopProduct, DashboardStats } from '@/types';

type Period = 'daily' | 'weekly' | 'monthly';

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Last 30 days',
  weekly: 'Last 12 weeks',
  monthly: 'Last 12 months',
};

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs space-y-1.5">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-muted-foreground">
              {p.name === 'revenue' ? 'Revenue' : 'Transactions'}
            </span>
          </div>
          <span className="font-semibold">
            {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs space-y-0.5">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-primary font-semibold">{formatCurrency(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

// ─── KPI Bar ──────────────────────────────────────────────────────────────────

function KpiBar({ data, loading }: { data?: DashboardStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-16 mt-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const avgOrder =
    data.sales.thisMonth > 0 ? data.revenue.thisMonth / data.sales.thisMonth : 0;

  const metrics = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.revenue.total),
      sub: 'All-time',
      icon: DollarSign,
      trend: null,
    },
    {
      label: 'This Month',
      value: formatCurrency(data.revenue.thisMonth),
      sub: `${data.sales.thisMonth} transactions`,
      icon: TrendingUp,
      trend: { value: data.revenue.growthPercent, label: 'vs last month' },
    },
    {
      label: 'Last Month',
      value: formatCurrency(data.revenue.lastMonth),
      sub: `${data.sales.lastMonth} transactions`,
      icon: ShoppingCart,
      trend: null,
    },
    {
      label: 'Avg. Order',
      value: formatCurrency(avgOrder),
      sub: 'This month',
      icon: BarChart2,
      trend: null,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {metrics.map((m) => {
        const isPositive = (m.trend?.value ?? 0) >= 0;
        return (
          <Card key={m.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg sm:text-xl font-bold mt-1 tracking-tight">{m.value}</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-muted-foreground truncate">{m.sub}</p>
                {m.trend && (
                  <span
                    className={cn(
                      'flex items-center gap-0.5 text-[10px] font-medium shrink-0',
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(m.trend.value).toFixed(1)}%
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('daily');
  const c = useChartColors();

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await analyticsApi.dashboard();
      return res.data.data;
    },
  });

  const { data: chartData, isLoading: chartLoading } = useQuery<ChartDataPoint[]>({
    queryKey: ['sales-chart', period],
    queryFn: async () => {
      const res = await analyticsApi.salesChart(period);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: topProducts, isLoading: topLoading } = useQuery<TopProduct[]>({
    queryKey: ['top-products'],
    queryFn: async () => {
      const res = await analyticsApi.topProducts(8);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const tickFormatter = (v: string) => {
    if (period === 'monthly') return v.slice(0, 7);
    return v.slice(5);
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Sales performance and business insights
          </p>
        </div>
        {statsError && (
          <Button size="sm" variant="outline" onClick={() => refetchStats()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        )}
      </div>

      {/* KPI Summary */}
      <KpiBar data={stats} loading={statsLoading} />

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>{PERIOD_LABELS[period]}</CardDescription>
          </div>
          <div className="flex gap-1 shrink-0">
            {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5 capitalize"
                onClick={() => setPeriod(p)}
              >
                {p}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : (chartData ?? []).length === 0 ? (
            <EmptyState
              icon={BarChart2}
              title="No data for this period"
              className="h-[300px]"
              compact
            />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c.primary} stopOpacity={c.primaryOpacity} />
                      <stop offset="95%" stopColor={c.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={tickFormatter}
                  />
                  <YAxis
                    yAxisId="rev"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <YAxis
                    yAxisId="cnt"
                    orientation="right"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke={c.primary}
                    strokeWidth={2}
                    fill="url(#analyticsGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: c.primary }}
                  />
                  <Line
                    yAxisId="cnt"
                    type="monotone"
                    dataKey="count"
                    name="count"
                    stroke={c.tick}
                    strokeWidth={1.5}
                    dot={false}
                    strokeDasharray="4 3"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                  Revenue (left axis)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-5 bg-muted-foreground/50 inline-block" />
                  Transactions (right axis)
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Top Products — two columns */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* By Revenue — horizontal bar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Products by Revenue</CardTitle>
            <CardDescription>Highest-grossing items</CardDescription>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : (topProducts ?? []).length === 0 ? (
              <EmptyState icon={BarChart2} title="No sales data yet" compact className="h-[260px]" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={(topProducts ?? []).slice(0, 8).map((tp) => ({
                    name: (tp.product?.name ?? 'Unknown').split(' ').slice(0, 3).join(' '),
                    revenue: Math.round(tp.totalRevenue * 100) / 100,
                  }))}
                  layout="vertical"
                  margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={c.grid}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip content={<BarTooltip />} />
                  <Bar
                    dataKey="revenue"
                    fill={c.primary}
                    radius={[0, 4, 4, 0]}
                    maxBarSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By Quantity — ranked list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Products by Quantity</CardTitle>
            <CardDescription>Most frequently sold items</CardDescription>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3.5 w-16" />
                    </div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : (topProducts ?? []).length === 0 ? (
              <EmptyState icon={ShoppingCart} title="No sales data yet" compact />
            ) : (
              <div className="space-y-3.5">
                {(topProducts ?? [])
                  .slice()
                  .sort((a, b) => b.totalQuantity - a.totalQuantity)
                  .slice(0, 8)
                  .map((tp, i, arr) => {
                    const maxQty = arr[0]?.totalQuantity ?? 1;
                    const pct = Math.round((tp.totalQuantity / maxQty) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 text-xs text-muted-foreground shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium truncate">
                              {tp.product?.name ?? 'Unknown'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {tp.totalQuantity} units
                            </span>
                            <span className="text-sm font-semibold w-20 text-right">
                              {formatCurrency(tp.totalRevenue)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-6 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary/60 h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
