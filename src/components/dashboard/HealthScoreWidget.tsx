'use client';

import { useEffect, useRef, useState, useMemo, useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDollarSign, Package, Users, Receipt,
  TrendingUp, TrendingDown, Minus, Sparkles,
  RefreshCw, AlertTriangle, CheckCircle2, Lightbulb,
  ShieldAlert, ArrowRight, Brain,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/components/theme-provider';
import { aiApi, analyticsApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type {
  BusinessInsights, SalesForecast, RestockRecommendations, DashboardStats,
} from '@/types';

// ── Status tiers ──────────────────────────────────────────────────────────────

type HealthStatus = 'excellent' | 'healthy' | 'moderate' | 'critical';

interface StatusConfig {
  label: string;
  color: string;       // hex for SVG
  tw: string;          // Tailwind text
  bg: string;          // Tailwind bg (faint)
  ring: string;        // border/ring
  glow: string;        // CSS filter glow
  badgeVariant: 'success' | 'info' | 'warning' | 'destructive';
}

function getStatus(score: number): StatusConfig {
  if (score >= 85) return {
    label: 'Excellent',    color: '#10b981',
    tw: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/8 dark:bg-emerald-500/10',
    ring: 'ring-emerald-500/30',
    glow: 'drop-shadow(0 0 10px rgba(16,185,129,.55))',
    badgeVariant: 'success',
  };
  if (score >= 65) return {
    label: 'Healthy',      color: '#3b82f6',
    tw: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/8 dark:bg-blue-500/10',
    ring: 'ring-blue-500/30',
    glow: 'drop-shadow(0 0 10px rgba(59,130,246,.55))',
    badgeVariant: 'info',
  };
  if (score >= 45) return {
    label: 'Moderate',     color: '#f59e0b',
    tw: 'text-amber-500 dark:text-amber-400',
    bg: 'bg-amber-500/8 dark:bg-amber-500/10',
    ring: 'ring-amber-500/30',
    glow: 'drop-shadow(0 0 10px rgba(245,158,11,.55))',
    badgeVariant: 'warning',
  };
  return {
    label: 'Critical',     color: '#ef4444',
    tw: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/8 dark:bg-red-500/10',
    ring: 'ring-red-500/30',
    glow: 'drop-shadow(0 0 10px rgba(239,68,68,.55))',
    badgeVariant: 'destructive',
  };
}

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs = 1600, enabled = true): number {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) { setDisplay(0); return; }
    startRef.current = null;
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const p = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs, enabled]);

  return display;
}

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({
  score, loading, status,
}: {
  score: number; loading: boolean; status: StatusConfig;
}) {
  const { resolvedTheme } = useTheme();
  const uid = useId().replace(/:/g, '');

  const R = 82;
  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const circ = 2 * Math.PI * R;
  const trackColor = resolvedTheme === 'dark'
    ? 'hsl(217.2 32.6% 14%)'
    : 'hsl(214.3 31.8% 91%)';

  const display = useCountUp(score, 1500, !loading && score > 0);
  const offset = circ * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      {/* Ambient glow backdrop */}
      <div
        className="absolute rounded-full transition-all duration-700"
        style={{
          width: R * 1.8,
          height: R * 1.8,
          background: loading
            ? 'transparent'
            : `radial-gradient(ellipse at center, ${status.color}18 0%, transparent 70%)`,
        }}
      />

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          {/* Gradient for the progress arc */}
          <linearGradient id={`grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={status.color} stopOpacity="0.7" />
            <stop offset="100%" stopColor={status.color} stopOpacity="1" />
          </linearGradient>
          {/* Glow filter */}
          <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Tick marks clip — decorative outer ring */}
          <clipPath id={`clip-${uid}`}>
            <circle cx={CX} cy={CY} r={R + 14} />
          </clipPath>
        </defs>

        {/* Decorative dashed outer ring */}
        {!loading && (
          <circle
            cx={CX} cy={CY} r={R + 14}
            fill="none"
            stroke={status.color}
            strokeWidth="1"
            strokeDasharray="3 9"
            strokeOpacity="0.3"
          />
        )}

        {/* Background track */}
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={trackColor}
          strokeWidth="10"
        />

        {loading ? (
          /* Skeleton shimmer arc */
          <motion.circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke={trackColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
            animate={{ strokeDashoffset: [0, -circ] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <>
            {/* Glow layer */}
            <motion.circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={status.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${circ} ${circ}`}
              filter={`url(#glow-${uid})`}
              strokeOpacity="0.6"
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            />
            {/* Main arc */}
            <motion.circle
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={`url(#grad-${uid})`}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${circ} ${circ}`}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
            />
          </>
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rotate-0">
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-10 w-14 rounded-lg" />
            <Skeleton className="h-3.5 w-10 rounded" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-0.5"
          >
            <span
              className={cn('text-5xl font-black tabular-nums leading-none tracking-tight', status.tw)}
            >
              {display}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">/ 100</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ── Factor row ────────────────────────────────────────────────────────────────

interface FactorData {
  key: string;
  label: string;
  icon: React.ElementType;
  score: number;
  trend: 'up' | 'down' | 'stable';
  trendLabel: string;
  accent: string;          // Tailwind icon color
  accentBg: string;        // icon bg
  barColor: string;        // CSS color for the bar
}

const TREND_MAP = {
  up:     { Icon: TrendingUp,   cls: 'text-emerald-500 dark:text-emerald-400', label: (l: string) => l },
  down:   { Icon: TrendingDown, cls: 'text-red-500 dark:text-red-400',         label: (l: string) => l },
  stable: { Icon: Minus,        cls: 'text-slate-400',                          label: (l: string) => l },
};

function FactorRow({ factor, index }: { factor: FactorData; index: number }) {
  const Icon = factor.icon;
  const { Icon: TrendIcon, cls: trendCls } = TREND_MAP[factor.trend];
  const status = getStatus(factor.score);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.07, duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
      className="group"
    >
      <div className="flex items-center justify-between gap-3 mb-1.5">
        {/* Icon + label */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
            factor.accentBg,
          )}>
            <Icon className={cn('h-3 w-3', factor.accent)} />
          </div>
          <span className="text-xs font-medium text-foreground truncate">{factor.label}</span>
        </div>

        {/* Score + trend */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('text-xs font-bold tabular-nums', status.tw)}>
            {factor.score}
          </span>
          <div className={cn('flex items-center gap-0.5 text-[10px] font-medium', trendCls)}>
            <TrendIcon className="h-3 w-3" />
            <span className="hidden sm:inline">{factor.trendLabel}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: factor.barColor }}
          initial={{ width: 0 }}
          whileInView={{ width: `${factor.score}%` }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 + index * 0.07, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </motion.div>
  );
}

// ── Mini insights ─────────────────────────────────────────────────────────────

function InsightChip({
  text, kind, index,
}: {
  text: string; kind: 'positive' | 'negative' | 'neutral'; index: number;
}) {
  const cfg = {
    positive: { Icon: CheckCircle2, cls: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/8 dark:bg-emerald-500/10 border-emerald-500/20' },
    negative: { Icon: AlertTriangle, cls: 'text-red-500 dark:text-red-400',         bg: 'bg-red-500/8 dark:bg-red-500/10 border-red-500/20' },
    neutral:  { Icon: Lightbulb,     cls: 'text-amber-500 dark:text-amber-400',      bg: 'bg-amber-500/8 dark:bg-amber-500/10 border-amber-500/20' },
  }[kind];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.05 + index * 0.06, duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2.5',
        cfg.bg,
      )}
    >
      <cfg.Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', cfg.cls)} />
      <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{text}</p>
    </motion.div>
  );
}

// ── Factor derivation ─────────────────────────────────────────────────────────

function deriveFactors(
  stats: DashboardStats | undefined,
  forecast: SalesForecast | undefined,
  restock: RestockRecommendations | undefined,
): FactorData[] {
  // ── Revenue ─────────────────────────────────────────────
  const growth = stats?.revenue.growthPercent ?? 0;
  const revScore = Math.min(97, Math.max(8, Math.round(60 + growth * 0.75)));
  const revTrend: FactorData['trend'] =
    growth > 2 ? 'up' : growth < -2 ? 'down' : 'stable';

  // ── Inventory ────────────────────────────────────────────
  const total = stats?.inventory.totalProducts ?? 0;
  const low   = stats?.inventory.lowStockCount ?? 0;
  const lowPct = total > 0 ? (low / total) * 100 : 0;
  const invScore = Math.min(97, Math.max(8, Math.round(97 - lowPct * 1.4)));
  const invTrend: FactorData['trend'] = lowPct > 25 ? 'down' : lowPct > 10 ? 'stable' : 'up';

  // ── Customer growth (proxy: sales this vs last month) ────
  const salesThis = stats?.sales.thisMonth ?? 0;
  const salesLast = stats?.sales.lastMonth ?? 0;
  const salesGrowth = salesLast > 0
    ? ((salesThis - salesLast) / salesLast) * 100
    : salesThis > 0 ? 20 : 0;
  const custScore = Math.min(97, Math.max(8, Math.round(60 + salesGrowth * 0.7)));
  const custTrend: FactorData['trend'] =
    salesGrowth > 3 ? 'up' : salesGrowth < -3 ? 'down' : 'stable';

  // ── Expenses (inverse of restock pressure) ───────────────
  const critical = restock?.criticalCount ?? 0;
  const high     = restock?.highCount ?? 0;
  const expScore = Math.min(97, Math.max(8, Math.round(92 - critical * 9 - high * 4)));
  const expTrend: FactorData['trend'] = critical > 1 ? 'down' : critical === 1 ? 'stable' : 'up';

  return [
    {
      key: 'revenue',
      label: 'Revenue',
      icon: CircleDollarSign,
      score: revScore,
      trend: revTrend,
      trendLabel: growth !== 0 ? `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%` : 'Stable',
      accent: 'text-blue-600 dark:text-blue-400',
      accentBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      barColor: 'linear-gradient(90deg,#3b82f6,#2563eb)',
    },
    {
      key: 'inventory',
      label: 'Inventory',
      icon: Package,
      score: invScore,
      trend: invTrend,
      trendLabel: low > 0 ? `${low} low` : 'Optimal',
      accent: 'text-emerald-600 dark:text-emerald-400',
      accentBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      barColor: 'linear-gradient(90deg,#10b981,#059669)',
    },
    {
      key: 'customer',
      label: 'Customer Growth',
      icon: Users,
      score: custScore,
      trend: custTrend,
      trendLabel: salesGrowth !== 0 ? `${salesGrowth > 0 ? '+' : ''}${salesGrowth.toFixed(0)}%` : 'Stable',
      accent: 'text-violet-600 dark:text-violet-400',
      accentBg: 'bg-violet-500/10 dark:bg-violet-500/15',
      barColor: 'linear-gradient(90deg,#8b5cf6,#7c3aed)',
    },
    {
      key: 'expenses',
      label: 'Expenses',
      icon: Receipt,
      score: expScore,
      trend: expTrend,
      trendLabel: critical > 0 ? `${critical} critical` : 'Controlled',
      accent: 'text-amber-600 dark:text-amber-400',
      accentBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      barColor: 'linear-gradient(90deg,#f59e0b,#d97706)',
    },
  ];
}

// ── Skeleton widget ───────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Ring area */}
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
        <div className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      {/* Factors */}
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────

interface HealthScoreWidgetProps {
  className?: string;
}

export function HealthScoreWidget({ className }: HealthScoreWidgetProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: insights, isLoading: insL, refetch: refetchIns } =
    useQuery<BusinessInsights>({
      queryKey: ['ai-insights'],
      queryFn: async () => { const r = await aiApi.insights(); return r.data.data; },
      staleTime: 60 * 60 * 1000,
      retry: false,
    });

  const { data: forecast, isLoading: foreL } =
    useQuery<SalesForecast>({
      queryKey: ['ai-forecast'],
      queryFn: async () => {
        await new Promise(r => setTimeout(r, 800));
        const res = await aiApi.forecast();
        return res.data.data;
      },
      staleTime: 60 * 60 * 1000,
      retry: false,
    });

  const { data: restock, isLoading: restL } =
    useQuery<RestockRecommendations>({
      queryKey: ['ai-restock'],
      queryFn: async () => {
        await new Promise(r => setTimeout(r, 1600));
        const res = await aiApi.restock();
        return res.data.data;
      },
      staleTime: 60 * 60 * 1000,
      retry: false,
    });

  const { data: stats } =
    useQuery<DashboardStats>({
      queryKey: ['analytics-dashboard'],
      queryFn: async () => { const r = await analyticsApi.dashboard(); return r.data.data; },
      staleTime: 5 * 60 * 1000,
    });

  const loading = insL || foreL;

  // Derive composite health score
  const factors = useMemo(
    () => deriveFactors(stats, forecast, restock),
    [stats, forecast, restock]
  );

  const score = useMemo(() => {
    if (insights?.healthScore !== undefined) return insights.healthScore;
    if (factors.length === 0) return 0;
    const weights = [0.3, 0.25, 0.25, 0.2];
    return Math.round(factors.reduce((s, f, i) => s + f.score * weights[i], 0));
  }, [insights, factors]);

  const status = getStatus(score);

  // Mini insights: blend AI-generated + derived
  const miniInsights = useMemo(() => {
    const items: { text: string; kind: 'positive' | 'negative' | 'neutral' }[] = [];

    // From AI insights
    if (insights?.insights?.length) {
      const top = [...insights.insights].sort((a, b) => {
        const w = { high: 2, medium: 1, low: 0 };
        return w[b.impact] - w[a.impact];
      }).slice(0, 2);
      top.forEach((ins) => {
        items.push({
          text: ins.description,
          kind: ins.impact === 'high' ? 'negative' : ins.impact === 'medium' ? 'neutral' : 'positive',
        });
      });
    }

    // From opportunities
    if (insights?.opportunities?.[0]) {
      items.push({ text: insights.opportunities[0], kind: 'positive' });
    }

    // Derived fallbacks
    if (items.length === 0) {
      const g = stats?.revenue.growthPercent ?? 0;
      if (g > 0) items.push({ text: `Revenue is growing ${g.toFixed(1)}% month-over-month.`, kind: 'positive' });
      else if (g < 0) items.push({ text: `Revenue declined ${Math.abs(g).toFixed(1)}% vs last month.`, kind: 'negative' });

      if ((restock?.criticalCount ?? 0) > 0) {
        items.push({ text: `${restock!.criticalCount} product${restock!.criticalCount > 1 ? 's are' : ' is'} critically low on stock.`, kind: 'negative' });
      } else if (restock?.items?.length === 0) {
        items.push({ text: 'All inventory levels are within healthy thresholds.', kind: 'positive' });
      }
    }

    return items.slice(0, 3);
  }, [insights, stats, restock]);

  const refresh = () => {
    setRefreshKey(k => k + 1);
    refetchIns();
  };

  const isFetching = insL || foreL || restL;

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Top accent gradient */}
      <div
        className="h-[2px] w-full transition-all duration-700"
        style={{
          background: loading
            ? 'hsl(var(--muted))'
            : `linear-gradient(90deg, transparent, ${status.color}80, transparent)`,
        }}
      />

      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border/60">

          {/* ── Left: ring + status ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-8">
            {/* Header inside left panel */}
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold tracking-tight">Business Health</span>
              </div>
              <div className="flex items-center gap-2">
                {isFetching && (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">Analysing…</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={refresh}
                  disabled={isFetching}
                  title="Refresh score"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Ring */}
            <ScoreRing score={score} loading={loading} status={status} />

            {/* Status chip */}
            <AnimatePresence mode="wait">
              {!loading && (
                <motion.div
                  key={`status-${score}`}
                  initial={{ opacity: 0, y: 6, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                  className="flex flex-col items-center gap-1.5"
                >
                  {/* Status badge with pulse */}
                  <div className={cn(
                    'flex items-center gap-2 rounded-full px-3.5 py-1.5 ring-1',
                    status.bg, status.ring,
                  )}>
                    <span className="relative flex h-2 w-2">
                      <span className={cn(
                        'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                        status.badgeVariant === 'success'     && 'bg-emerald-500',
                        status.badgeVariant === 'info'        && 'bg-blue-500',
                        status.badgeVariant === 'warning'     && 'bg-amber-500',
                        status.badgeVariant === 'destructive' && 'bg-red-500',
                      )} />
                      <span className={cn(
                        'relative h-2 w-2 rounded-full',
                        status.badgeVariant === 'success'     && 'bg-emerald-500',
                        status.badgeVariant === 'info'        && 'bg-blue-500',
                        status.badgeVariant === 'warning'     && 'bg-amber-500',
                        status.badgeVariant === 'destructive' && 'bg-red-500',
                      )} />
                    </span>
                    <span className={cn('text-sm font-bold tracking-tight', status.tw)}>
                      {status.label}
                    </span>
                  </div>

                  {/* AI label from Gemini */}
                  {insights?.healthLabel && (
                    <p className="text-xs text-muted-foreground text-center max-w-[180px] leading-relaxed">
                      {insights.healthLabel}
                    </p>
                  )}

                  {/* Powered by badge */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <Sparkles className="h-3 w-3 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50 font-medium">
                      Powered by Gemini
                    </span>
                  </div>
                </motion.div>
              )}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Skeleton className="h-7 w-28 rounded-full" />
                  <Skeleton className="h-3 w-36" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right: factors + insights ───────────────────────────────────── */}
          <div className="flex flex-col gap-0 divide-y divide-border/60">

            {/* Factor breakdown */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Factor Breakdown
                </p>
                {!loading && (
                  <p className="text-[10px] text-muted-foreground/50">
                    {insights?.generatedAt
                      ? `${new Date(insights.generatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Derived from live data'}
                  </p>
                )}
              </div>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-md" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-3 w-14" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {factors.map((factor, i) => (
                    <FactorRow key={factor.key} factor={factor} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* Mini insights */}
            <div className="px-6 py-5 space-y-3 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Key Insights
              </p>

              {loading ? (
                <div className="space-y-2.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              ) : miniInsights.length > 0 ? (
                <div className="space-y-2">
                  {miniInsights.map((ins, i) => (
                    <InsightChip key={i} text={ins.text} kind={ins.kind} index={i} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  No critical issues detected
                </div>
              )}

              {/* CTA — link to full AI insights */}
              {!loading && (
                <motion.a
                  href="/dashboard/ai"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className={cn(
                    'mt-1 inline-flex items-center gap-1.5 text-[11px] font-semibold',
                    'text-primary/70 hover:text-primary transition-colors'
                  )}
                >
                  View full AI analysis
                  <ArrowRight className="h-3 w-3" />
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
