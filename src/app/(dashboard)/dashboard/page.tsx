'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  Zap,
  BarChart2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Users,
  Store,
  Clock,
  ShoppingCart,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  Bar,
  ComposedChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, formatDateTime, SALE_STATUS_LABELS } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useChartColors } from '@/hooks/useChartColors';
import { cn } from '@/lib/utils';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { HealthScoreWidget } from '@/components/dashboard/HealthScoreWidget';
import { AIDailySummary } from '@/components/dashboard/AIDailySummary';
import type { DashboardStats, ChartDataPoint, TopProduct } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ChartPeriod = '7D' | '30D' | '90D';
const PERIOD_DAYS: Record<ChartPeriod, number> = { '7D': 7, '30D': 30, '90D': 90 };

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: number; label: string };
  loading?: boolean;
}

function KpiCard({ title, value, sub, icon: Icon, iconBg, iconColor, trend, loading }: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-7 w-28 mb-1.5" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBg)}>
          <Icon className={cn('h-4 w-4', iconColor)} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1.5 text-xs font-medium',
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>
              {Math.abs(trend.value).toFixed(1)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">{p.name === 'revenue' ? 'Revenue' : 'Orders'}</span>
          <span className="font-semibold">
            {p.name === 'revenue' ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('30D');
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

  const {
    data: rawChart,
    isLoading: chartLoading,
    isError: chartError,
  } = useQuery<ChartDataPoint[]>({
    queryKey: ['sales-chart', 'daily'],
    queryFn: async () => {
      const res = await analyticsApi.salesChart('daily');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: topProducts,
    isLoading: topLoading,
  } = useQuery<TopProduct[]>({
    queryKey: ['top-products'],
    queryFn: async () => {
      const res = await analyticsApi.topProducts(5);
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const chartData = useMemo(() => {
    if (!rawChart) return [];
    const days = PERIOD_DAYS[chartPeriod];
    return rawChart.slice(-days);
  }, [rawChart, chartPeriod]);

  const dailyData = useMemo(() => (rawChart ?? []).slice(-7), [rawChart]);

  const avgOrderValue =
    stats && stats.sales.thisMonth > 0
      ? stats.revenue.thisMonth / stats.sales.thisMonth
      : 0;

  const statusBadge: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
    COMPLETED: 'success',
    PENDING: 'warning',
    CANCELLED: 'destructive',
    REFUNDED: 'secondary',
  };

  const maxRevenue = Math.max(...dailyData.map((d) => d.revenue), 1);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }).format(new Date())}
          </p>
        </div>
        {user?.role === 'ADMIN' && stats && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{stats.users ?? 0} users</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" />
              <span>{stats.stores ?? 0} stores</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Error state ───────────────────────────────────────── */}
      {statsError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-4 px-5">
            <p className="text-sm text-destructive">Failed to load dashboard data.</p>
            <Button size="sm" variant="outline" onClick={() => refetchStats()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── AI Daily Summary ─────────────────────────────────── */}
      <AIDailySummary />

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={stats ? formatCurrency(stats.revenue.total) : '—'}
          sub="All-time earnings"
          icon={DollarSign}
          iconBg="bg-blue-500/10 dark:bg-blue-500/15"
          iconColor="text-blue-600 dark:text-blue-400"
          trend={stats ? { value: stats.revenue.growthPercent, label: 'vs last month' } : undefined}
          loading={statsLoading}
        />
        <KpiCard
          title="This Month"
          value={stats ? formatCurrency(stats.revenue.thisMonth) : '—'}
          sub={stats ? `${stats.sales.thisMonth} transactions` : ''}
          icon={TrendingUp}
          iconBg="bg-emerald-500/10 dark:bg-emerald-500/15"
          iconColor="text-emerald-600 dark:text-emerald-400"
          loading={statsLoading}
        />
        <KpiCard
          title="Today"
          value={stats ? formatCurrency(stats.sales.todayRevenue) : '—'}
          sub={stats ? `${stats.sales.today} sale${stats.sales.today !== 1 ? 's' : ''}` : ''}
          icon={Zap}
          iconBg="bg-amber-500/10 dark:bg-amber-500/15"
          iconColor="text-amber-600 dark:text-amber-400"
          loading={statsLoading}
        />
        <KpiCard
          title="Avg. Order"
          value={stats ? formatCurrency(avgOrderValue) : '—'}
          sub="Per transaction this month"
          icon={BarChart2}
          iconBg="bg-purple-500/10 dark:bg-purple-500/15"
          iconColor="text-purple-600 dark:text-purple-400"
          loading={statsLoading}
        />
      </div>

      {/* ── Business Health Score ─────────────────────────────── */}
      <HealthScoreWidget />

      {/* ── Revenue Chart + Top Products ──────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Revenue & Orders Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-4">
            <div>
              <CardTitle className="text-base">Revenue & Orders</CardTitle>
              <CardDescription>
                {chartPeriod === '7D' ? 'Last 7 days' : chartPeriod === '30D' ? 'Last 30 days' : 'Last 90 days'}
              </CardDescription>
            </div>
            <div className="flex gap-1 shrink-0">
              {(['7D', '30D', '90D'] as ChartPeriod[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={chartPeriod === p ? 'default' : 'outline'}
                  className="h-7 text-xs px-2.5"
                  onClick={() => setChartPeriod(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : chartError ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Failed to load chart data
              </div>
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={BarChart2}
                title="No sales data"
                description="Sales will appear here once transactions are recorded."
                className="h-[260px]"
                compact
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
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
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis
                    yAxisId="rev"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    yAxisId="cnt"
                    orientation="right"
                    tick={{ fontSize: 10, fill: c.tick }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke={c.primary}
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: c.primary }}
                  />
                  <Bar
                    yAxisId="cnt"
                    dataKey="count"
                    name="count"
                    fill={c.barMuted}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={10}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary inline-block" />
                Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30 inline-block" />
                Orders
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Products</CardTitle>
            <CardDescription>Best performers by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
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
              <EmptyState
                icon={Package}
                title="No sales yet"
                description="Top products will appear once sales are recorded."
                compact
              />
            ) : (
              <div className="space-y-4">
                {(topProducts ?? []).map((tp, i) => {
                  const maxRev = topProducts?.[0]?.totalRevenue ?? 1;
                  const pct = Math.round((tp.totalRevenue / maxRev) * 100);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                              i === 0
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                : i === 1
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                : i === 2
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {tp.product?.name ?? 'Unknown'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold shrink-0 text-primary">
                          {formatCurrency(tp.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              'h-1.5 rounded-full transition-all duration-700',
                              i === 0 ? 'bg-primary' : 'bg-primary/50'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground w-14 text-right shrink-0">
                          {tp.totalQuantity} units
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Daily Overview + Alerts + Recent ──────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* 7-Day Daily Sales Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Daily Sales Overview</CardTitle>
                <CardDescription>Revenue per day — last 7 days</CardDescription>
              </div>
              {dailyData.length > 0 && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">7-day total</p>
                  <p className="text-sm font-bold text-primary">
                    {formatCurrency(dailyData.reduce((s, d) => s + d.revenue, 0))}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[200px] w-full rounded-lg" />
            ) : dailyData.length === 0 ? (
              <EmptyState
                icon={ShoppingCart}
                title="No sales in the last 7 days"
                compact
                className="h-[200px]"
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={dailyData} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: c.tick }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: string) =>
                        new Date(v).toLocaleDateString('en-US', { weekday: 'short' })
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: c.tick }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                      }
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="rounded-lg border bg-card shadow-lg px-3 py-2 text-xs space-y-0.5">
                            <p className="font-semibold">
                              {new Date(label as string).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-primary font-semibold">
                              {formatCurrency((payload[0]?.value as number) ?? 0)}
                            </p>
                            <p className="text-muted-foreground">
                              {payload[1]?.value ?? 0} orders
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill={c.primary}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="count"
                      fill={c.barMuted}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
                {/* Mini sparkline strip */}
                <div className="grid grid-cols-7 gap-1 mt-3">
                  {dailyData.map((d) => (
                    <div key={d.date} className="text-center">
                      <div
                        className="mx-auto w-full rounded-sm bg-primary/10 mb-1"
                        style={{
                          height: `${Math.max(3, Math.round((d.revenue / maxRevenue) * 28))}px`,
                        }}
                      />
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(d.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Right column: Low Stock + Recent Sales */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Low Stock Alerts */}
          <Card className="flex-1 min-h-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription>
                {statsLoading
                  ? '…'
                  : `${stats?.inventory.lowStockCount ?? 0} product${
                      (stats?.inventory.lowStockCount ?? 0) !== 1 ? 's' : ''
                    } need restocking`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full rounded-md" />
                  ))}
                </div>
              ) : (stats?.inventory.lowStockItems ?? []).length === 0 ? (
                <div className="flex items-center gap-2 py-3 text-sm text-green-600 dark:text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
                  All products are well stocked
                </div>
              ) : (
                <div className="space-y-2">
                  {(stats?.inventory.lowStockItems ?? []).slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-900/30"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                      <Badge
                        variant={item.stock === 0 ? 'destructive' : 'warning'}
                        className="shrink-0 text-xs"
                      >
                        {item.stock === 0 ? 'Out' : `${item.stock} left`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="flex-1 min-h-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (stats?.recentSales ?? []).length === 0 ? (
                <EmptyState icon={ShoppingCart} title="No sales yet" compact />
              ) : (
                <div className="divide-y divide-border -mx-1">
                  {(stats?.recentSales ?? []).slice(0, 4).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between py-2.5 px-1 gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-medium truncate">{sale.receiptNumber}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {sale.cashier.name} · {formatDateTime(sale.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={statusBadge[sale.status] ?? 'secondary'}
                          className="text-[10px] px-1.5 py-0 hidden sm:inline-flex"
                        >
                          {SALE_STATUS_LABELS[sale.status]}
                        </Badge>
                        <span className="text-sm font-bold">{formatCurrency(sale.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Live Activity Feed ─────────────────────────────────────────────────── */}
      <ActivityFeed />
    </div>
  );
}
