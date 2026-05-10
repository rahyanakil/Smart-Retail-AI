'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, AlertTriangle, Brain, TrendingUp, Package,
  RefreshCw, Activity, Zap, CheckCircle2, CreditCard,
  Banknote, Wallet, User, Store,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsApi } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import type {
  DashboardStats, BusinessInsights, SalesForecast,
  RestockRecommendations, PaymentMethod, Sale,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type ActivityKind = 'sale' | 'low_stock' | 'out_of_stock' | 'ai_insights' |
                   'ai_forecast' | 'ai_restock' | 'system';

type BadgeVariant = 'success' | 'warning' | 'destructive' | 'info' | 'secondary';

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
  title: string;
  detail: string;
  timestamp: string;
  amount?: number;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
}

// ── Accent palette ────────────────────────────────────────────────────────────

const PALETTE = {
  emerald: { iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15', iconText: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',     iconText: 'text-amber-600 dark:text-amber-400'   },
  red:     { iconBg: 'bg-red-500/10 dark:bg-red-500/15',         iconText: 'text-red-600 dark:text-red-400'       },
  violet:  { iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',   iconText: 'text-violet-600 dark:text-violet-400' },
  blue:    { iconBg: 'bg-blue-500/10 dark:bg-blue-500/15',       iconText: 'text-blue-600 dark:text-blue-400'     },
  slate:   { iconBg: 'bg-slate-500/10 dark:bg-slate-500/15',     iconText: 'text-slate-500 dark:text-slate-400'   },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1_000);
    if (s < 5)   return 'just now';
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

function sinceRefresh(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1_000);
  if (s < 5)   return 'just now';
  if (s < 60)  return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

const PAY_ICON: Record<PaymentMethod, React.ElementType> = {
  CASH:           Banknote,
  CARD:           CreditCard,
  DIGITAL_WALLET: Wallet,
};

function buildSaleActivity(sale: Sale): ActivityItem {
  const PayIcon = PAY_ICON[sale.paymentMethod] ?? CreditCard;
  const itemCount = sale.items.reduce((s, i) => s + i.quantity, 0);
  return {
    id: `sale-${sale.id}`,
    kind: 'sale',
    icon: PayIcon,
    ...PALETTE.emerald,
    title: `Sale ${sale.receiptNumber} completed`,
    detail: `${sale.cashier.name} · ${itemCount} item${itemCount !== 1 ? 's' : ''} · ${sale.store.name}`,
    timestamp: sale.createdAt,
    amount: sale.total,
    badgeLabel: 'Sale',
    badgeVariant: 'success',
  };
}

function buildLowStockActivity(
  item: Pick<import('@/types').Product, 'id' | 'name' | 'sku' | 'stock' | 'lowStockAlert'>
): ActivityItem {
  const out = item.stock === 0;
  return {
    id: `stock-${item.id}`,
    kind: out ? 'out_of_stock' : 'low_stock',
    icon: out ? AlertTriangle : Package,
    ...(out ? PALETTE.red : PALETTE.amber),
    title: out ? `Out of stock: ${item.name}` : `Low stock: ${item.name}`,
    detail: out
      ? `SKU ${item.sku} · Reorder threshold: ${item.lowStockAlert} units`
      : `${item.stock} unit${item.stock !== 1 ? 's' : ''} remaining · Threshold: ${item.lowStockAlert}`,
    timestamp: new Date(Date.now() - Math.random() * 3_600_000).toISOString(),
    badgeLabel: out ? 'Out of Stock' : 'Low Stock',
    badgeVariant: out ? 'destructive' : 'warning',
  };
}

function buildAiInsightsActivity(data: BusinessInsights): ActivityItem {
  return {
    id: 'ai-insights',
    kind: 'ai_insights',
    icon: Brain,
    ...PALETTE.violet,
    title: 'AI Business Insights generated',
    detail: `Health score ${data.healthScore}/100 · ${data.insights.length} insight${data.insights.length !== 1 ? 's' : ''} · ${data.healthLabel}`,
    timestamp: data.generatedAt,
    badgeLabel: 'AI Report',
    badgeVariant: 'info',
  };
}

function buildAiForecastActivity(data: SalesForecast): ActivityItem {
  return {
    id: 'ai-forecast',
    kind: 'ai_forecast',
    icon: TrendingUp,
    ...PALETTE.blue,
    title: 'Sales Forecast analysis complete',
    detail: `${data.period} · Expected ${formatCurrency(data.predictedRevenue.expected)} · Trend ${data.trend}`,
    timestamp: data.generatedAt,
    badgeLabel: 'AI Forecast',
    badgeVariant: 'info',
  };
}

function buildAiRestockActivity(data: RestockRecommendations): ActivityItem {
  const hasCritical = data.criticalCount > 0;
  return {
    id: 'ai-restock',
    kind: 'ai_restock',
    icon: Package,
    ...(hasCritical ? PALETTE.amber : PALETTE.blue),
    title: 'Restock Recommendations ready',
    detail: `${data.criticalCount} critical · ${data.totalAtRisk} product${data.totalAtRisk !== 1 ? 's' : ''} at risk`,
    timestamp: data.generatedAt,
    badgeLabel: 'AI Restock',
    badgeVariant: hasCritical ? 'warning' : 'info',
  };
}

function buildSystemActivity(sessionStart: number): ActivityItem {
  return {
    id: 'system-init',
    kind: 'system',
    icon: Zap,
    ...PALETTE.slate,
    title: 'Dashboard session started',
    detail: 'All services online · Real-time sync active',
    timestamp: new Date(sessionStart).toISOString(),
    badgeLabel: 'System',
    badgeVariant: 'secondary',
  };
}

function mergeActivities(
  stats: DashboardStats | undefined,
  insights: BusinessInsights | undefined,
  forecast: SalesForecast | undefined,
  restock: RestockRecommendations | undefined,
  sessionStart: number,
): ActivityItem[] {
  const items: ActivityItem[] = [];

  if (stats?.recentSales?.length) {
    stats.recentSales
      .filter((s) => s.status === 'COMPLETED')
      .forEach((s) => items.push(buildSaleActivity(s)));
  }

  if (stats?.inventory?.lowStockItems?.length) {
    stats.inventory.lowStockItems
      .slice(0, 3)
      .forEach((item) => items.push(buildLowStockActivity(item)));
  }

  if (insights) items.push(buildAiInsightsActivity(insights));
  if (forecast)  items.push(buildAiForecastActivity(forecast));
  if (restock)   items.push(buildAiRestockActivity(restock));

  items.push(buildSystemActivity(sessionStart));

  // Deduplicate by id, sort newest-first
  const seen = new Set<string>();
  return items
    .filter((i) => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
}

// ── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 py-3.5 px-1">
      <Skeleton className="h-9 w-9 rounded-full shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2 pt-1">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1.5 pt-1">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ── Single activity row ───────────────────────────────────────────────────────

function ActivityRow({
  item,
  isNew,
  isLast,
}: {
  item: ActivityItem;
  isNew: boolean;
  isLast: boolean;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'group relative flex items-start gap-3 px-1',
        'py-3.5 transition-colors hover:bg-accent/40 rounded-xl -mx-1 px-2',
      )}
    >
      {/* Vertical connector line */}
      {!isLast && (
        <div className="absolute left-[22px] top-[46px] bottom-0 w-px bg-border/60 pointer-events-none" />
      )}

      {/* Icon ring */}
      <div className={cn(
        'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center',
        'rounded-full border border-border/60 mt-0.5',
        item.iconBg,
      )}>
        <Icon className={cn('h-4 w-4', item.iconText)} />
        {isNew && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative h-3 w-3 rounded-full bg-primary ring-2 ring-background" />
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-snug text-foreground truncate pr-2">
          {item.title}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed truncate">
          {item.detail}
        </p>
      </div>

      {/* Right metadata */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 pl-2">
        {item.amount !== undefined && (
          <span className="text-sm font-bold tabular-nums text-foreground">
            {formatCurrency(item.amount)}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/70 whitespace-nowrap">
          {relativeTime(item.timestamp)}
        </span>
        <Badge
          variant={item.badgeVariant}
          className="text-[9px] px-1.5 h-4 font-semibold uppercase tracking-wide hidden sm:inline-flex"
        >
          {item.badgeLabel}
        </Badge>
      </div>
    </motion.div>
  );
}

// ── Live pulse dot ────────────────────────────────────────────────────────────

function LiveDot() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
      <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  className?: string;
  maxHeight?: string;
}

export function ActivityFeed({ className, maxHeight = '520px' }: ActivityFeedProps) {
  const qc = useQueryClient();
  const sessionStartRef = useRef(Date.now());
  const prevIdsRef = useRef<Set<string>>(new Set());

  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [tick, setTick] = useState(0);

  // Tick every 10s to keep relative timestamps fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const { data: stats, isLoading, isFetching, refetch } = useQuery<DashboardStats>({
    queryKey: ['activity-feed-stats'],
    queryFn: async () => {
      const r = await analyticsApi.dashboard();
      setLastRefresh(Date.now());
      return r.data.data;
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  });

  // Read AI data from cache (populated if user visited AI Insights page)
  const insights   = qc.getQueryData<BusinessInsights>(['ai-insights']);
  const forecast   = qc.getQueryData<SalesForecast>(['ai-forecast']);
  const restock    = qc.getQueryData<RestockRecommendations>(['ai-restock']);

  const activities = mergeActivities(stats, insights, forecast, restock, sessionStartRef.current);

  // Track which items are "new" since the last render
  const currentIds = new Set(activities.map((a) => a.id));
  const newIds = new Set<string>();
  if (prevIdsRef.current.size > 0) {
    currentIds.forEach((id) => { if (!prevIdsRef.current.has(id)) newIds.add(id); });
  }
  prevIdsRef.current = currentIds;

  // Stagger container
  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } },
  };

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <CardHeader className="pb-3 pt-5 px-5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Live Activity
            </CardTitle>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 px-2.5 py-1">
              <LiveDot />
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && (
              <span className="hidden sm:inline text-[11px] text-muted-foreground/60">
                {sinceRefresh(lastRefresh)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh activity"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* ── Divider ────────────────────────────────────────────────────────── */}
      <div className="h-px bg-border/60 mx-5 shrink-0" />

      {/* ── Feed ───────────────────────────────────────────────────────────── */}
      <CardContent
        className="flex-1 overflow-y-auto px-4 py-2 min-h-0"
        style={{ maxHeight }}
      >
        {isLoading ? (
          <div>
            {Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2 className="h-9 w-9 text-muted-foreground/25" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Activity will appear here as your store operates
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            key="feed"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="relative"
          >
            {activities.map((item, idx) => (
              <ActivityRow
                key={item.id}
                item={item}
                isNew={newIds.has(item.id)}
                isLast={idx === activities.length - 1}
              />
            ))}
          </motion.div>
        )}
      </CardContent>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      {!isLoading && activities.length > 0 && (
        <>
          <div className="h-px bg-border/60 mx-5 shrink-0" />
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <span className="text-[11px] text-muted-foreground/60">
              {activities.length} event{activities.length !== 1 ? 's' : ''} · auto-refresh every 30s
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Store className="h-3 w-3" />
              <span>Store-wide feed</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
