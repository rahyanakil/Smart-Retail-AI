'use client';

import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/theme-provider';
import {
  Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus,
  Package, AlertTriangle, CheckCircle2, ShieldAlert,
  Lightbulb, Zap, CircleDollarSign, Activity, Target,
  ChevronRight, Clock, Brain, ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { AIInsightsPanel } from '@/components/ai/AIInsightsPanel';
import { aiApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type { BusinessInsights, SalesForecast, RestockRecommendations, BusinessInsight } from '@/types';

// ── Animation presets ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const } },
};

const staggerGrid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } as const,
};

const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const } },
};

// ── Palette constants ─────────────────────────────────────────────────────────

const IMPACT_STYLES = {
  high:   { border: 'border-l-red-500',   bg: 'bg-red-50/40 dark:bg-red-900/15',    badge: 'destructive' as const },
  medium: { border: 'border-l-amber-500', bg: 'bg-amber-50/30 dark:bg-amber-900/15', badge: 'warning' as const },
  low:    { border: 'border-l-blue-400',  bg: 'bg-blue-50/20 dark:bg-blue-900/15',   badge: 'secondary' as const },
};

const URGENCY_STYLES = {
  critical: { bg: 'bg-red-50/60 dark:bg-red-900/20 border-red-200 dark:border-red-800/40',           dot: 'bg-red-500',                       badge: 'destructive' as const },
  high:     { bg: 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',   dot: 'bg-amber-500',                     badge: 'warning' as const },
  medium:   { bg: 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',         dot: 'bg-slate-400 dark:bg-slate-500',   badge: 'secondary' as const },
};

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string }> = {
  revenue:    { icon: CircleDollarSign, color: 'text-blue-600 dark:text-blue-400'    },
  inventory:  { icon: Package,          color: 'text-emerald-600 dark:text-emerald-400' },
  operations: { icon: Zap,              color: 'text-violet-600 dark:text-violet-400'  },
  growth:     { icon: TrendingUp,       color: 'text-green-600 dark:text-green-400'   },
};

// ── Health ring ───────────────────────────────────────────────────────────────

function HealthRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, score)) / 100);
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const { resolvedTheme } = useTheme();
  const trackColor = resolvedTheme === 'dark' ? 'hsl(217.2 32.6% 16%)' : 'hsl(214.3 31.8% 91.4%)';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="136" height="136" className="-rotate-90" aria-hidden>
        <circle cx="68" cy="68" r={r} fill="none" stroke={trackColor} strokeWidth="10" />
        <circle
          cx="68" cy="68" r={r} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tabular-nums leading-none" style={{ color }}>{score}</span>
        <span className="text-[11px] text-muted-foreground mt-1">/ 100</span>
      </div>
    </div>
  );
}

// ── Trend pill ────────────────────────────────────────────────────────────────

function TrendPill({ trend, pct }: { trend: 'up' | 'down' | 'stable'; pct: number }) {
  const map = {
    up:     { icon: TrendingUp,   cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',  label: `+${pct.toFixed(1)}%` },
    down:   { icon: TrendingDown, cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',          label: `-${pct.toFixed(1)}%` },
    stable: { icon: Minus,        cls: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',      label: 'Stable' },
  };
  const { icon: Icon, cls, label } = map[trend];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', cls)}>
      <Icon className="h-3 w-3" />{label}
    </span>
  );
}

function PulseBlock({ className }: { className?: string }) {
  return <Skeleton className={className} />;
}

function GeneratedAt({ ts }: { ts: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 mt-1">
      <Clock className="h-3 w-3" />
      Generated {new Date(ts).toLocaleString()}
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4">
      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-destructive">Failed to load</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 1 — Quick KPI bar
// ══════════════════════════════════════════════════════════════════════════════

interface QuickKpi {
  label: string; value: string; sub: string;
  icon: React.ElementType; iconBg: string; iconColor: string; accent?: string;
}

function QuickKpiCard({ kpi, loading }: { kpi: QuickKpi; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <PulseBlock className="h-3.5 w-24" />
            <PulseBlock className="h-9 w-9 rounded-xl" />
          </div>
          <PulseBlock className="h-7 w-32 mb-1.5" />
          <PulseBlock className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }
  const Icon = kpi.icon;
  return (
    <motion.div variants={staggerItem}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', kpi.iconBg)}>
              <Icon className={cn('h-4 w-4', kpi.iconColor)} />
            </div>
          </div>
          <p className={cn('text-2xl font-black tracking-tight tabular-nums', kpi.accent ?? 'text-foreground')}>
            {kpi.value}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">{kpi.sub}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 2 — Business Summary + Health
// ══════════════════════════════════════════════════════════════════════════════

function InsightRow({ insight }: { insight: BusinessInsight }) {
  const { border, bg, badge } = IMPACT_STYLES[insight.impact];
  const { icon: Icon, color } = CATEGORY_META[insight.category] ?? { icon: Activity, color: 'text-primary' };
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border border-l-4 px-3 py-2.5', border, bg)}>
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold">{insight.title}</p>
          <Badge variant={badge} className="text-[10px] px-1.5 py-0 capitalize">{insight.impact}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 mt-1" />
    </div>
  );
}

function SummaryCard({ data, loading, error }: {
  data?: BusinessInsights; loading: boolean; error: string | null;
}) {
  if (loading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader><PulseBlock className="h-5 w-44" /></CardHeader>
        <CardContent className="space-y-3">
          <PulseBlock className="h-4 w-full" />
          <PulseBlock className="h-4 w-5/6" />
          <PulseBlock className="h-4 w-4/6" />
          <div className="pt-2 space-y-2.5">
            {[1,2,3,4].map(i => <PulseBlock key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="lg:col-span-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Business Summary</CardTitle>
        </div>
        {data && <GeneratedAt ts={data.generatedAt} />}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <ErrorCard message={error} />}
        {data && (
          <>
            <p className="text-sm text-muted-foreground leading-relaxed">{data.summary}</p>
            <div className="space-y-2.5">
              {data.insights.slice(0, 4).map((ins, i) => (
                <InsightRow key={i} insight={ins} />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HealthCard({ data, loading, error }: {
  data?: BusinessInsights; loading: boolean; error: string | null;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader><PulseBlock className="h-5 w-32" /></CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-4">
          <PulseBlock className="h-36 w-36 rounded-full" />
          <PulseBlock className="h-4 w-24" />
          <div className="w-full space-y-2">
            {[1,2,3].map(i => <PulseBlock key={i} className="h-8 w-full rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Business Health</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {error && <ErrorCard message={error} />}
        {data && (
          <>
            <HealthRing score={data.healthScore} />
            <div className="text-center">
              <p className={cn(
                'text-base font-bold',
                data.healthScore >= 75 ? 'text-green-600 dark:text-green-400'
                : data.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
              )}>
                {data.healthLabel}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Overall business score</p>
            </div>
            <Separator className="w-full" />
            <div className="w-full grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-green-50 dark:bg-green-900/15 border border-green-100 dark:border-green-800/30 py-2.5">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">{data.opportunities.length}</p>
                <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">Opportunities</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/30 py-2.5">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{data.risks.length}</p>
                <p className="text-[10px] text-red-700 dark:text-red-500 font-medium">Risks</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 3 — Sales Forecast
// ══════════════════════════════════════════════════════════════════════════════

function ForecastSection({ data, loading, error }: {
  data?: SalesForecast; loading: boolean; error: string | null;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5"><PulseBlock className="h-5 w-40" /><PulseBlock className="h-3.5 w-56" /></div>
            <PulseBlock className="h-8 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[1,2,3].map(i => <PulseBlock key={i} className="h-20 rounded-xl" />)}
          </div>
          <div className="space-y-2.5">
            {[1,2,3,4].map(i => <PulseBlock key={i} className="h-10 w-full rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Sales Forecast</CardTitle>
            </div>
            <CardDescription className="mt-0.5">{data?.period ?? 'Next 30 days'}</CardDescription>
            {data && <GeneratedAt ts={data.generatedAt} />}
          </div>
          {data && <TrendPill trend={data.trend} pct={data.trendPercent} />}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <ErrorCard message={error} />}
        {data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Conservative', value: data.predictedRevenue.min,      accent: 'text-muted-foreground', bg: 'bg-muted/40' },
                { label: 'Expected',     value: data.predictedRevenue.expected,  accent: 'text-primary',          bg: 'bg-primary/5 border-primary/20' },
                { label: 'Optimistic',   value: data.predictedRevenue.max,       accent: 'text-muted-foreground', bg: 'bg-muted/40' },
              ].map(({ label, value, accent, bg }) => (
                <div key={label} className={cn('rounded-xl border px-4 py-4 text-center', bg)}>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1">{label}</p>
                  <p className={cn('text-xl font-black tabular-nums', accent)}>{formatCurrency(value)}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Weekly Breakdown</p>
              <div className="space-y-2.5">
                {data.weeklyBreakdown.map((w, i) => {
                  const maxRev = Math.max(...data.weeklyBreakdown.map(x => x.expectedRevenue), 1);
                  const pct = Math.round((w.expectedRevenue / maxRev) * 100);
                  const confColor = w.confidence === 'high' ? 'bg-primary' : w.confidence === 'medium' ? 'bg-amber-400' : 'bg-slate-300';
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <p className="text-xs text-muted-foreground w-44 shrink-0 truncate">{w.week}</p>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn('h-2 rounded-full transition-all duration-700', confColor)}
                          style={{ width: `${pct}%`, transitionDelay: `${i * 80}ms` }} />
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-36 justify-end">
                        <span className="text-sm font-semibold tabular-nums">{formatCurrency(w.expectedRevenue)}</span>
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                          w.confidence === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          w.confidence === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        )}>
                          {w.confidence}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {data.keyFactors.length > 0 && (
              <>
                <Separator />
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Factors</p>
                    <ul className="space-y-1.5">
                      {data.keyFactors.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recommendations</p>
                    <ul className="space-y-1.5">
                      {data.recommendations.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 4 — Restock Recommendations
// ══════════════════════════════════════════════════════════════════════════════

function RestockSection({ data, loading, error }: {
  data?: RestockRecommendations; loading: boolean; error: string | null;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader><PulseBlock className="h-5 w-44" /></CardHeader>
        <CardContent className="space-y-2.5">
          {[1,2,3,4].map(i => <PulseBlock key={i} className="h-16 w-full rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Restock Recommendations</CardTitle>
          </div>
          {data && (
            <div className="flex items-center gap-2">
              {data.criticalCount > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white inline-block animate-pulse" />
                  {data.criticalCount} critical
                </Badge>
              )}
              {data.highCount > 0 && (
                <Badge variant="warning" className="text-[10px]">{data.highCount} high</Badge>
              )}
            </div>
          )}
        </div>
        {data && <GeneratedAt ts={data.generatedAt} />}
      </CardHeader>
      <CardContent className="space-y-2.5">
        {error && <ErrorCard message={error} />}
        {data && (
          <>
            <div className="rounded-lg bg-muted/40 border px-3 py-2.5 text-xs text-muted-foreground">
              {data.summary}
            </div>
            {data.items.length === 0 ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-900/15 px-4 py-3">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-400 font-medium">All products are well stocked</p>
              </div>
            ) : (
              data.items.map((item, i) => {
                const { bg, dot, badge } = URGENCY_STYLES[item.urgency];
                return (
                  <div key={i} className={cn('rounded-lg border px-4 py-3 space-y-1.5', bg)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <Badge variant={badge} className="text-[10px] px-1.5 capitalize shrink-0">{item.urgency}</Badge>
                        </div>
                        <p className="text-[11px] font-mono text-muted-foreground ml-4">{item.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">Reorder</p>
                        <p className="text-base font-black">{item.recommendedReorderQty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className={cn('font-medium',
                        item.currentStock === 0 ? 'text-red-600 dark:text-red-400' :
                        item.estimatedDaysLeft <= 3 ? 'text-red-500 dark:text-red-400' :
                        item.estimatedDaysLeft <= 7 ? 'text-amber-600 dark:text-amber-400' : ''
                      )}>
                        {item.currentStock === 0 ? 'Out of stock' : `${item.currentStock} in stock`}
                        {item.currentStock > 0 && item.estimatedDaysLeft > 0 && ` · ~${item.estimatedDaysLeft}d left`}
                      </span>
                      <span>{item.reason}</span>
                      {item.estimatedCost > 0 && (
                        <span className="ml-auto font-semibold text-foreground">{formatCurrency(item.estimatedCost)}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {data.items.length > 0 && data.totalInvestmentEstimate > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-xs text-muted-foreground font-medium">Total estimated restock investment</p>
                <p className="text-sm font-black text-primary">{formatCurrency(data.totalInvestmentEstimate)}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section 5 — Alerts & Signals
// ══════════════════════════════════════════════════════════════════════════════

function AlertsSection({ insights, restock, loading }: {
  insights?: BusinessInsights; restock?: RestockRecommendations; loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader><PulseBlock className="h-5 w-28" /></CardHeader>
        <CardContent className="space-y-2.5">
          {[1,2,3,4,5].map(i => <PulseBlock key={i} className="h-10 w-full rounded-lg" />)}
        </CardContent>
      </Card>
    );
  }

  const criticalStock = (restock?.items ?? []).filter(i => i.urgency === 'critical');

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-base">Alerts & Signals</CardTitle>
        </div>
        <CardDescription>Risks to address and opportunities to capture</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalStock.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block animate-pulse" />
              Critical Stock
            </p>
            <div className="space-y-1.5">
              {criticalStock.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/15 px-3 py-2.5">
                  <Package className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-red-700 dark:text-red-400 truncate">{item.name}</p>
                    <p className="text-[10px] text-red-600 dark:text-red-500">
                      {item.currentStock === 0 ? 'Out of stock' : `${item.currentStock} remaining · ~${item.estimatedDaysLeft}d`}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-[10px] px-1.5 shrink-0">Critical</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {(insights?.risks ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-2 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> Risks to Address
            </p>
            <div className="space-y-1.5">
              {(insights?.risks ?? []).map((r, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-red-50/40 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 px-3 py-2">
                  <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{r}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(insights?.opportunities ?? []).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" /> Opportunities
            </p>
            <div className="space-y-1.5">
              {(insights?.opportunities ?? []).map((o, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-lg bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 px-3 py-2">
                  <ArrowUpRight className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">{o}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !criticalStock.length && !insights?.risks?.length && !insights?.opportunities?.length && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-400 opacity-60" />
            <p className="text-sm text-muted-foreground">No alerts — generate AI analysis to surface insights.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════════

// ── Rate-limit countdown ──────────────────────────────────────────────────────

function RateLimitBanner({ onRetry }: { onRetry: () => void }) {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-900/20 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            AI rate limit reached
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            {seconds > 0
              ? `Gemini free tier allows 15 calls per minute. Retry in ${seconds}s.`
              : 'You can now retry.'}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onRetry}
        disabled={seconds > 0}
        className="border-amber-300 dark:border-amber-700 shrink-0"
      >
        {seconds > 0 ? `Retry in ${seconds}s` : 'Retry now'}
      </Button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AiInsightsDashboardPage() {
  const qc = useQueryClient();

<<<<<<< HEAD
  // staleTime + gcTime both 60 min:
  //  - staleTime: data considered fresh for 60 min → no background refetch on navigate/focus
  //  - gcTime:    keep in QueryClient memory for 60 min → hot-reload / remount never re-fetches
  //  - refetchOnMount: false → don't even check staleness when component mounts; use what's cached
  //  - retry: false → 429s from Gemini must not be retried (global queryClient also blocks 429 retries)
  const AI_QUERY_OPTS = {
    staleTime: 1000 * 60 * 60,
    gcTime:    1000 * 60 * 60,
    refetchOnMount: false as const,
    retry: false,
  } as const;

  const { data: insights, isLoading: insightsLoading, error: insightsErr, isError: insightsIsError } =
    useQuery<BusinessInsights>({
      queryKey: ['ai-insights'],
      queryFn: async () => { const r = await aiApi.insights(); return r.data.data; },
      ...AI_QUERY_OPTS,
    });

  const { data: forecast, isLoading: forecastLoading, error: forecastErr, isError: forecastIsError } =
    useQuery<SalesForecast>({
      queryKey: ['ai-forecast'],
      queryFn: async () => { const r = await aiApi.forecast(); return r.data.data; },
      ...AI_QUERY_OPTS,
    });

  const { data: restock, isLoading: restockLoading, error: restockErr, isError: restockIsError } =
    useQuery<RestockRecommendations>({
      queryKey: ['ai-restock'],
      queryFn: async () => { const r = await aiApi.restock(); return r.data.data; },
      ...AI_QUERY_OPTS,
=======
  const { data: insights, isLoading: insightsLoading, error: insightsErr, isError: insightsIsError } =
    useQuery<BusinessInsights>({
      queryKey: ['ai-insights'],
      queryFn: async () => { const r = await aiApi.insights(); return r.data.data; },
      staleTime: 1000 * 60 * 60,
      retry: false,
    });

  const { data: forecast, isLoading: forecastLoading, error: forecastErr, isError: forecastIsError } =
    useQuery<SalesForecast>({
      queryKey: ['ai-forecast'],
      queryFn: async () => {
        await new Promise(r => setTimeout(r, 1000));
        const res = await aiApi.forecast();
        return res.data.data;
      },
      staleTime: 1000 * 60 * 60,
      retry: false,
    });

  const { data: restock, isLoading: restockLoading, error: restockErr, isError: restockIsError } =
    useQuery<RestockRecommendations>({
      queryKey: ['ai-restock'],
      queryFn: async () => {
        await new Promise(r => setTimeout(r, 2000));
        const res = await aiApi.restock();
        return res.data.data;
      },
      staleTime: 1000 * 60 * 60,
      retry: false,
>>>>>>> 00bb9b3f0137eb6b246f4d9514e728d0f30c38ef
    });

  const anyLoading = insightsLoading || forecastLoading || restockLoading;

  const refreshAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['ai-insights'] });
    qc.invalidateQueries({ queryKey: ['ai-forecast'] });
    qc.invalidateQueries({ queryKey: ['ai-restock'] });
  }, [qc]);

  const getErrMsg = (e: unknown) =>
    (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    (e instanceof Error ? e.message : null);

  // Detect rate-limit error on any of the three queries
  const isRateLimited = [insightsErr, forecastErr, restockErr].some(
    (e) =>
      (e as { response?: { data?: { code?: string } } })?.response?.data?.code === 'AI_RATE_LIMITED' ||
      (e as { response?: { status?: number } })?.response?.status === 429
  );

  // ── Quick KPI data ──────────────────────────────────────────────────────────

  const kpis: QuickKpi[] = [
    {
      label: 'Business Health',
      value: insights ? `${insights.healthScore}` : '—',
      sub: insights?.healthLabel ?? 'Generating…',
      icon: Activity,
      iconBg: insights?.healthScore !== undefined
        ? insights.healthScore >= 75 ? 'bg-green-500/10 dark:bg-green-500/15'
          : insights.healthScore >= 50 ? 'bg-amber-500/10 dark:bg-amber-500/15'
          : 'bg-red-500/10 dark:bg-red-500/15'
        : 'bg-muted',
      iconColor: insights?.healthScore !== undefined
        ? insights.healthScore >= 75 ? 'text-green-600 dark:text-green-400'
          : insights.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground',
      accent: insights?.healthScore !== undefined
        ? insights.healthScore >= 75 ? 'text-green-600 dark:text-green-400'
          : insights.healthScore >= 50 ? 'text-amber-600 dark:text-amber-400'
          : 'text-red-600 dark:text-red-400'
        : undefined,
    },
    {
      label: 'Forecast Revenue',
      value: forecast ? formatCurrency(forecast.predictedRevenue.expected) : '—',
      sub: forecast?.period ?? 'Generating…',
      icon: Target,
      iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
      accent: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Items at Risk',
      value: restock ? `${restock.totalAtRisk}` : '—',
      sub: restock ? `${restock.criticalCount} critical, ${restock.highCount} high` : 'Generating…',
      icon: Package,
      iconBg: restock?.criticalCount ? 'bg-red-500/10 dark:bg-red-500/15' : 'bg-amber-500/10 dark:bg-amber-500/15',
      iconColor: restock?.criticalCount ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
      accent: restock?.criticalCount ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Opportunities',
      value: insights ? `${insights.opportunities.length}` : '—',
      sub: insights ? `${insights.risks.length} risk${insights.risks.length !== 1 ? 's' : ''} to address` : 'Generating…',
      icon: Sparkles,
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="space-y-8">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/80 to-primary shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Live analysis powered by Google Gemini · Results cached for 1 hour
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {anyLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Generating analysis…
            </div>
          )}
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={anyLoading} className="gap-2">
            <RefreshCw className={cn('h-3.5 w-3.5', anyLoading && 'animate-spin')} />
            Refresh All
          </Button>
        </div>
      </motion.div>
<<<<<<< HEAD

      {/* ── Rate-limit banner ───────────────────────────────────────────────── */}
      {isRateLimited && <RateLimitBanner onRetry={refreshAll} />}
=======
>>>>>>> 00bb9b3f0137eb6b246f4d9514e728d0f30c38ef

      {/* ── Quick KPIs ──────────────────────────────────────────────────────── */}
      {anyLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k) => <QuickKpiCard key={k.label} kpi={k} loading />)}
        </div>
      ) : (
        <motion.div
          variants={staggerGrid}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {kpis.map((k) => <QuickKpiCard key={k.label} kpi={k} loading={false} />)}
        </motion.div>
      )}

      {/* ── Business Summary + Health ring ──────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        <SummaryCard
          data={insights}
          loading={insightsLoading}
          error={insightsIsError ? getErrMsg(insightsErr) : null}
        />
        <HealthCard
          data={insights}
          loading={insightsLoading}
          error={insightsIsError ? getErrMsg(insightsErr) : null}
        />
      </motion.div>

      {/* ── Sales Forecast ──────────────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.08 }}
      >
        <ForecastSection
          data={forecast}
          loading={forecastLoading}
          error={forecastIsError ? getErrMsg(forecastErr) : null}
        />
      </motion.div>

      {/* ── AI Insights Panel (animated cards) ──────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
      >
        <AIInsightsPanel
          insights={insights}
          forecast={forecast}
          restock={restock}
          loading={anyLoading}
          onRefresh={refreshAll}
        />
      </motion.div>

      {/* ── Restock + Alerts ────────────────────────────────────────────────── */}
      <motion.div
        variants={staggerGrid}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.05 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <motion.div variants={staggerItem}>
          <RestockSection
            data={restock}
            loading={restockLoading}
            error={restockIsError ? getErrMsg(restockErr) : null}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <AlertsSection
            insights={insights}
            restock={restock}
            loading={insightsLoading || restockLoading}
          />
        </motion.div>
      </motion.div>

    </div>
  );
}
