'use client';

import { useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Sparkles, CircleDollarSign, TrendingUp, TrendingDown,
  Package, Target, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Lightbulb, ShieldAlert, ChevronRight,
  RefreshCw, CheckCircle2, Brain, Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi, aiApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type {
  DashboardStats, BusinessInsights, SalesForecast, RestockRecommendations,
} from '@/types';

// ── Animation variants ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.23, 1, 0.32, 1] as const } },
};

const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] as const } },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1)   return 'just now';
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

/**
 * Synthesise a one-paragraph business narrative from live data.
 * Used when AI insights haven't been generated yet.
 */
function synthesiseSummary(
  stats: DashboardStats,
  forecast?: SalesForecast,
): string {
  const { revenue, sales, inventory } = stats;
  const parts: string[] = [];

  // Sales activity
  if (sales.today > 0) {
    parts.push(
      `${sales.today} sale${sales.today !== 1 ? 's' : ''} completed today ` +
      `totalling ${formatCurrency(sales.todayRevenue)}`
    );
  } else {
    parts.push('No transactions recorded yet today');
  }

  // Monthly performance
  const g = revenue.growthPercent;
  if (Math.abs(g) >= 1) {
    parts.push(
      `monthly revenue is ${g > 0 ? 'up' : 'down'} ${Math.abs(g).toFixed(1)}% ` +
      `compared to last month (${formatCurrency(revenue.thisMonth)})`
    );
  }

  // Inventory
  if (inventory.lowStockCount > 0) {
    parts.push(
      `${inventory.lowStockCount} product${inventory.lowStockCount !== 1 ? 's' : ''} ` +
      `need${inventory.lowStockCount === 1 ? 's' : ''} restocking`
    );
  } else {
    parts.push('all inventory levels are healthy');
  }

  // Forecast hint
  if (forecast) {
    parts.push(
      `revenue for the coming period is forecast at ${formatCurrency(forecast.predictedRevenue.expected)}`
    );
  }

  return parts.join('. ') + '.';
}

// ── Stat block ────────────────────────────────────────────────────────────────

interface StatBlockProps {
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
  label: string;
  value: string;
  sub: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; text: string };
  alert?: boolean;
}

function StatBlock({ icon: Icon, iconBg, iconText, label, value, sub, trend, alert }: StatBlockProps) {
  const TrendIcon = trend?.direction === 'up' ? ArrowUpRight : trend?.direction === 'down' ? ArrowDownRight : null;
  const trendCls  = trend?.direction === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400';

  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border p-4',
        'bg-card/70 backdrop-blur-sm',
        'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5',
        alert
          ? 'border-amber-200/60 dark:border-amber-800/30'
          : 'border-border/50',
      )}
    >
      {/* Subtle top-corner glow on hover */}
      <div className={cn(
        'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
        'bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent pointer-events-none',
      )} />

      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/30',
          iconBg,
        )}>
          <Icon className={cn('h-4 w-4', iconText)} />
        </div>
        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-0.5 text-[11px] font-semibold', trendCls)}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trend.text}</span>
          </div>
        )}
        {alert && !trend && (
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse mt-1" />
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          {label}
        </p>
        <p className="text-[22px] font-bold tabular-nums leading-tight tracking-tight text-foreground">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground leading-snug">{sub}</p>
      </div>
    </motion.div>
  );
}

// ── Insight row ───────────────────────────────────────────────────────────────

type InsightKind = 'risk' | 'opportunity' | 'info';

const INSIGHT_CFG: Record<InsightKind, {
  icon: React.ElementType; dot: string; text: string; bg: string;
}> = {
  risk:        { icon: ShieldAlert,    dot: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',     bg: 'bg-red-500/[0.06] dark:bg-red-500/[0.08]'     },
  opportunity: { icon: Lightbulb,      dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08]' },
  info:        { icon: Brain,          dot: 'bg-blue-500',    text: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-500/[0.06] dark:bg-blue-500/[0.08]'   },
};

function InsightRow({ text, kind }: { text: string; kind: InsightKind }) {
  const cfg = INSIGHT_CFG[kind];
  const Icon = cfg.icon;
  return (
    <motion.div
      variants={staggerItem}
      className={cn(
        'flex items-start gap-3 rounded-xl px-3.5 py-2.5',
        cfg.bg,
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.text)} />
      <p className="text-[12.5px] text-foreground/80 leading-relaxed flex-1">{text}</p>
    </motion.div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-52" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        {/* Summary text */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
        {/* Insights */}
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── AIDailySummary ────────────────────────────────────────────────────────────

interface AIDailySummaryProps {
  className?: string;
}

export function AIDailySummary({ className }: AIDailySummaryProps) {
  const qc = useQueryClient();

  // Primary data — reuses the cache from the main dashboard page
  const { data: stats, isLoading: statsLoading, refetch } =
    useQuery<DashboardStats>({
      queryKey: ['dashboard'],
      queryFn: async () => { const r = await analyticsApi.dashboard(); return r.data.data; },
      staleTime: 5 * 60_000,
    });

  // AI data — reads from cache only (populated when user visits AI Insights page)
  const insights  = qc.getQueryData<BusinessInsights>(['ai-insights']);
  const forecast  = qc.getQueryData<SalesForecast>(['ai-forecast']);
  const restock   = qc.getQueryData<RestockRecommendations>(['ai-restock']);

  const isLoading = statsLoading;
  const hasAI     = !!(insights || forecast || restock);
  const genAt     = insights?.generatedAt ?? forecast?.generatedAt ?? restock?.generatedAt;

  // Compose the narrative paragraph
  const summaryText: string = stats
    ? (insights?.summary ?? synthesiseSummary(stats, forecast ?? undefined))
    : '';

  // Build stat blocks from live data
  const growth = stats?.revenue.growthPercent ?? 0;

  const statBlocks: StatBlockProps[] | null = stats ? [
    {
      icon: CircleDollarSign,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconText: 'text-blue-600 dark:text-blue-400',
      label: "Today's Revenue",
      value: formatCurrency(stats.sales.todayRevenue),
      sub: `${stats.sales.today} transaction${stats.sales.today !== 1 ? 's' : ''} today`,
      trend: undefined,
    },
    {
      icon: growth >= 0 ? TrendingUp : TrendingDown,
      iconBg: growth >= 0
        ? 'bg-emerald-500/10 dark:bg-emerald-500/15'
        : 'bg-red-500/10 dark:bg-red-500/15',
      iconText: growth >= 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400',
      label: 'Monthly Revenue',
      value: formatCurrency(stats.revenue.thisMonth),
      sub: `${stats.sales.thisMonth} transactions this month`,
      trend: Math.abs(growth) >= 0.5 ? {
        direction: growth >= 0 ? 'up' : 'down',
        text: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`,
      } : undefined,
    },
    {
      icon: Package,
      iconBg: stats.inventory.lowStockCount > 0
        ? 'bg-amber-500/10 dark:bg-amber-500/15'
        : 'bg-emerald-500/10 dark:bg-emerald-500/15',
      iconText: stats.inventory.lowStockCount > 0
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400',
      label: 'Inventory Status',
      value: `${stats.inventory.totalProducts}`,
      sub: stats.inventory.lowStockCount > 0
        ? `${stats.inventory.lowStockCount} item${stats.inventory.lowStockCount !== 1 ? 's' : ''} low on stock`
        : 'All products well stocked',
      alert: stats.inventory.lowStockCount > 0,
    },
    forecast
      ? {
          icon: Target,
          iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
          iconText: 'text-violet-600 dark:text-violet-400',
          label: 'Revenue Forecast',
          value: formatCurrency(forecast.predictedRevenue.expected),
          sub: forecast.period,
          trend: {
            direction: forecast.trend === 'up' ? 'up' : forecast.trend === 'down' ? 'down' : 'neutral',
            text: `${forecast.trendPercent > 0 ? '+' : ''}${forecast.trendPercent.toFixed(1)}%`,
          } as StatBlockProps['trend'],
        }
      : {
          icon: Brain,
          iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
          iconText: 'text-violet-600 dark:text-violet-400',
          label: 'AI Forecast',
          value: '—',
          sub: 'Visit AI Insights to generate',
        },
  ] : null;

  // Compile insights for the insight rail
  const insightRows: { text: string; kind: InsightKind }[] = [];

  if (insights?.risks?.[0])       insightRows.push({ text: insights.risks[0], kind: 'risk' });
  if (restock?.criticalCount && restock.criticalCount > 0) {
    insightRows.push({
      text: `${restock.criticalCount} product${restock.criticalCount !== 1 ? 's are' : ' is'} critically low — AI recommends immediate reorder`,
      kind: 'risk',
    });
  }
  if (insights?.opportunities?.[0]) insightRows.push({ text: insights.opportunities[0], kind: 'opportunity' });
  const topIns = insights?.insights?.find((i) => i.impact === 'high');
  if (topIns)                       insightRows.push({ text: topIns.description, kind: 'info' });

  // Fallback derived insights when AI data isn't available
  if (insightRows.length === 0 && stats) {
    if (stats.inventory.lowStockCount > 0) {
      insightRows.push({
        text: `${stats.inventory.lowStockCount} product${stats.inventory.lowStockCount !== 1 ? 's need' : ' needs'} restocking to avoid stockouts`,
        kind: 'risk',
      });
    }
    if (growth > 10) {
      insightRows.push({
        text: `Revenue is growing ${growth.toFixed(1)}% month-over-month — momentum is building`,
        kind: 'opportunity',
      });
    } else if (growth < -10) {
      insightRows.push({
        text: `Revenue declined ${Math.abs(growth).toFixed(1)}% vs last month — review sales strategy`,
        kind: 'risk',
      });
    }
    if (stats.sales.today > 0) {
      insightRows.push({
        text: `${stats.sales.today} sale${stats.sales.today !== 1 ? 's' : ''} recorded today totalling ${formatCurrency(stats.sales.todayRevenue)}`,
        kind: 'info',
      });
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (isLoading) return <SummaryCardSkeleton />;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeUp}
      className={className}
    >
      <Card className={cn(
        'relative overflow-hidden',
        'border-border/60',
      )}>
        {/* ── Ambient gradient overlay ──────────────────────────────────── */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          {/* Top-right corner bloom */}
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-primary/[0.07] dark:bg-primary/[0.10] blur-3xl" />
          {/* Bottom-left whisper */}
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-violet-500/[0.05] dark:bg-violet-500/[0.08] blur-3xl" />
        </div>

        <CardContent className="relative p-5 sm:p-6 space-y-6">

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                {/* Animated AI glyph */}
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/10 border border-primary/20"
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
                <h2 className="text-[15px] font-bold tracking-tight">Daily Summary</h2>
              </div>
              <p className="text-[11px] text-muted-foreground/60 ml-[2.375rem]">
                {new Intl.DateTimeFormat('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric',
                }).format(new Date())}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {hasAI ? (
                <Badge variant="info" className="text-[10px] gap-1.5 px-2.5 h-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" />
                  AI Generated
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] gap-1.5 px-2.5 h-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                  Live Data
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => refetch()}
                title="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* ── AI narrative summary ────────────────────────────────────── */}
          {summaryText && (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(5px)', y: 4 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease: 'easeOut' }}
              className={cn(
                'rounded-xl px-4 py-4',
                hasAI
                  ? 'bg-gradient-to-br from-primary/[0.06] to-violet-500/[0.04] dark:from-primary/[0.09] dark:to-violet-500/[0.06] border border-primary/10'
                  : 'bg-muted/40 border border-border/40',
              )}
            >
              {hasAI && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                  Gemini AI · Business Narrative
                </p>
              )}
              <p className={cn(
                'text-[13.5px] leading-relaxed text-foreground/80',
                hasAI && 'italic',
              )}>
                {summaryText}
              </p>
              {hasAI && insights?.healthScore !== undefined && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-primary/10">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'text-[11px] font-semibold',
                      insights.healthScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                      insights.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400',
                    )}>
                      {insights.healthScore}/100
                    </span>
                    <span className="text-[11px] text-muted-foreground">health score</span>
                  </div>
                  <span className="text-muted-foreground/30">·</span>
                  <span className={cn(
                    'text-[11px] font-medium',
                    insights.healthScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                    insights.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400',
                  )}>
                    {insights.healthLabel}
                  </span>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Stats grid ──────────────────────────────────────────────── */}
          {statBlocks && (
            <>
              <div className="flex items-center gap-2 -mb-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2">
                  Key Metrics
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 lg:grid-cols-4 gap-3"
              >
                {statBlocks.map((block, i) => (
                  <StatBlock key={i} {...block} />
                ))}
              </motion.div>
            </>
          )}

          {/* ── Key insights rail ────────────────────────────────────────── */}
          {insightRows.length > 0 && (
            <>
              <div className="flex items-center gap-2 -mb-1">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2">
                  {hasAI ? 'AI Insights' : 'Signals'}
                </span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {insightRows.slice(0, 4).map((row, i) => (
                  <InsightRow key={i} {...row} />
                ))}
              </motion.div>
            </>
          )}

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.3 }}
            className="flex items-center justify-between pt-1"
          >
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <Clock className="h-3 w-3" />
              {genAt
                ? `AI analysis ${relativeTime(genAt)}`
                : 'Live data · refreshes every 5 min'}
            </div>

            <a
              href="/dashboard/ai"
              className="flex items-center gap-1 text-[11px] font-semibold text-primary/60 hover:text-primary transition-colors"
            >
              {hasAI ? 'Full AI analysis' : 'Generate AI insights'}
              <ChevronRight className="h-3 w-3" />
            </a>
          </motion.div>

        </CardContent>
      </Card>
    </motion.div>
  );
}
