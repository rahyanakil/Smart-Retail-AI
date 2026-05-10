'use client';

import { motion } from 'framer-motion';
import {
  CircleDollarSign, Package, ShieldAlert, TrendingUp,
  TrendingDown, Activity, Sparkles, RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InsightCard, insightCardVariants } from './InsightCard';
import type { InsightCardProps, InsightAccent } from './InsightCard';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { BusinessInsights, SalesForecast, RestockRecommendations } from '@/types';

// ── Stagger container ─────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } } as const,
};

// ── Confidence derivation ─────────────────────────────────────────────────────

function impactConf(impact: 'high' | 'medium' | 'low') {
  return impact === 'high' ? 88 : impact === 'medium' ? 73 : 57;
}

function forecastConf(c: 'high' | 'medium' | 'low') {
  return c === 'high' ? 91 : c === 'medium' ? 75 : 58;
}

// ── Build typed cards from live API data ──────────────────────────────────────

function buildCards(
  insights?: BusinessInsights,
  forecast?: SalesForecast,
  restock?: RestockRecommendations
): InsightCardProps[] {
  const cards: InsightCardProps[] = [];

  // ── 1. Revenue Insight ─────────────────────────────────────────────────────
  const revIns = insights?.insights?.find((i) => i.category === 'revenue');
  if (revIns) {
    cards.push({
      icon: CircleDollarSign,
      categoryLabel: 'Revenue',
      title: revIns.title,
      summary: revIns.description,
      confidence: impactConf(revIns.impact),
      priority: revIns.impact === 'high' ? 'high' : revIns.impact === 'medium' ? 'medium' : 'low',
      timestamp: insights!.generatedAt,
      action: revIns.action ? 'View action' : undefined,
      accent: 'blue',
    });
  } else if (forecast) {
    const weekConf = forecast.weeklyBreakdown?.[0]?.confidence ?? 'medium';
    cards.push({
      icon: CircleDollarSign,
      categoryLabel: 'Revenue',
      title: `Projected Revenue: ${formatCurrency(forecast.predictedRevenue.expected)}`,
      summary: `Expected range ${formatCurrency(forecast.predictedRevenue.min)}–${formatCurrency(forecast.predictedRevenue.max)} over ${forecast.period}. ${forecast.keyFactors?.[0] ?? ''}`,
      confidence: forecastConf(weekConf),
      priority: forecast.trend === 'down' ? 'high' : 'medium',
      timestamp: forecast.generatedAt,
      accent: 'blue',
    });
  }

  // ── 2. Restock Recommendation ──────────────────────────────────────────────
  const topItem = restock?.items?.[0];
  if (topItem) {
    const daysLeft = topItem.estimatedDaysLeft;
    const conf = topItem.urgency === 'critical' ? 95 : topItem.urgency === 'high' ? 83 : 70;
    cards.push({
      icon: Package,
      categoryLabel: 'Restock Alert',
      title: `Restock "${topItem.name}"`,
      summary: `${topItem.currentStock > 0
        ? `${topItem.currentStock} units left (~${daysLeft} days remaining).`
        : 'Out of stock.'
      } Reorder ${topItem.recommendedReorderQty} units. ${topItem.reason}`,
      confidence: conf,
      priority: topItem.urgency === 'critical' ? 'critical' : topItem.urgency === 'high' ? 'high' : 'medium',
      timestamp: restock!.generatedAt,
      action: `Reorder ${topItem.recommendedReorderQty}`,
      accent: topItem.urgency === 'critical' ? 'red' : 'amber',
    });
  } else if (restock?.items?.length === 0) {
    cards.push({
      icon: Package,
      categoryLabel: 'Inventory',
      title: 'All Stock Levels Healthy',
      summary: restock.summary || 'No immediate restock action required. All products have sufficient inventory.',
      confidence: 92,
      priority: 'low',
      timestamp: restock.generatedAt,
      accent: 'emerald',
    });
  }

  // ── 3. Sales Anomaly Alert ────────────────────────────────────────────────
  const highOpsIns = insights?.insights?.find(
    (i) => i.impact === 'high' && (i.category === 'operations' || i.category === 'revenue')
  );
  const topRisk = insights?.risks?.[0];

  if (highOpsIns) {
    cards.push({
      icon: ShieldAlert,
      categoryLabel: 'Anomaly Alert',
      title: highOpsIns.title,
      summary: highOpsIns.description,
      confidence: 84,
      priority: 'high',
      timestamp: insights!.generatedAt,
      action: 'Review details',
      accent: 'red',
    });
  } else if (forecast?.trend === 'down') {
    cards.push({
      icon: TrendingDown,
      categoryLabel: 'Anomaly Alert',
      title: `Sales Trend Declining ${forecast.trendPercent.toFixed(1)}%`,
      summary: `Revenue is trending downward this period. ${forecast.recommendations?.[0] ?? 'Review pricing strategy and promotions to stabilise revenue.'}`,
      confidence: 80,
      priority: 'high',
      timestamp: forecast.generatedAt,
      action: 'Review strategy',
      accent: 'red',
    });
  } else if (topRisk) {
    cards.push({
      icon: ShieldAlert,
      categoryLabel: 'Risk Alert',
      title: 'Business Risk Identified',
      summary: topRisk,
      confidence: 78,
      priority: 'high',
      timestamp: insights!.generatedAt,
      accent: 'red',
    });
  }

  // ── 4. Business Trend ────────────────────────────────────────────────────
  const growthIns = insights?.insights?.find((i) => i.category === 'growth');
  const opportunity = insights?.opportunities?.[0];

  if (growthIns) {
    cards.push({
      icon: growthIns.impact !== 'low' ? TrendingUp : Activity,
      categoryLabel: 'Business Trend',
      title: growthIns.title,
      summary: growthIns.description,
      confidence: impactConf(growthIns.impact),
      priority: growthIns.impact === 'high' ? 'high' : 'medium',
      timestamp: insights!.generatedAt,
      action: growthIns.action ? 'Explore' : undefined,
      accent: 'emerald',
    });
  } else if (opportunity) {
    cards.push({
      icon: TrendingUp,
      categoryLabel: 'Business Trend',
      title: 'Growth Opportunity Identified',
      summary: opportunity,
      confidence: 76,
      priority: 'medium',
      timestamp: insights?.generatedAt ?? new Date().toISOString(),
      accent: 'emerald',
    });
  } else if (forecast && forecast.trend !== 'down') {
    const weekConf = forecast.weeklyBreakdown?.[0]?.confidence ?? 'medium';
    cards.push({
      icon: TrendingUp,
      categoryLabel: 'Business Trend',
      title: `${forecast.trend === 'up' ? 'Positive' : 'Stable'} Revenue Trajectory`,
      summary: `Revenue is trending ${forecast.trend} by ${forecast.trendPercent.toFixed(1)}% this period. ${forecast.keyFactors?.[0] ?? ''}`,
      confidence: forecastConf(weekConf),
      priority: forecast.trend === 'up' ? 'medium' : 'low',
      timestamp: forecast.generatedAt,
      accent: 'emerald',
    });
  }

  // ── Fill remaining slots from other insights (up to 6 total) ─────────────
  if (cards.length < 6 && insights?.insights?.length) {
    const usedTitles = new Set(cards.map((c) => c.title));
    const accentForCategory: Record<string, InsightAccent> = {
      revenue: 'blue', inventory: 'amber', operations: 'violet', growth: 'emerald',
    };

    for (const ins of insights.insights) {
      if (cards.length >= 6) break;
      if (usedTitles.has(ins.title)) continue;
      usedTitles.add(ins.title);

      cards.push({
        icon: Activity,
        categoryLabel: ins.category.charAt(0).toUpperCase() + ins.category.slice(1),
        title: ins.title,
        summary: ins.description,
        confidence: impactConf(ins.impact),
        priority: ins.impact === 'high' ? 'high' : ins.impact === 'medium' ? 'medium' : 'low',
        timestamp: insights.generatedAt,
        action: ins.action ? 'View action' : undefined,
        accent: accentForCategory[ins.category] ?? 'violet',
      });
    }
  }

  return cards;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function InsightCardSkeleton() {
  return (
    <motion.div variants={insightCardVariants} className="rounded-2xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-2.5 w-16" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="h-px bg-border/60" />
      <div className="space-y-2">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-3 w-20" />
      </div>
    </motion.div>
  );
}

// ── AIInsightsPanel ───────────────────────────────────────────────────────────

interface AIInsightsPanelProps {
  insights?: BusinessInsights;
  forecast?: SalesForecast;
  restock?: RestockRecommendations;
  loading: boolean;
  onRefresh?: () => void;
}

export function AIInsightsPanel({
  insights, forecast, restock, loading, onRefresh,
}: AIInsightsPanelProps) {
  const cards = (!loading && (insights || forecast || restock))
    ? buildCards(insights, forecast, restock)
    : [];

  const hasData = !loading && (insights || forecast || restock);

  return (
    <div className="space-y-5">
      {/* ── Section header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-primary/10 border border-violet-500/20">
            <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="leading-none space-y-0.5">
            <h2 className="text-sm font-bold tracking-tight">AI Insights</h2>
            <p className="text-[10px] text-muted-foreground">Powered by Google Gemini</p>
          </div>
          {!loading && hasData && (
            <Badge variant="outline" className="text-[10px] ml-0.5">
              {cards.length} active
            </Badge>
          )}
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Analysing…</span>
            </div>
          )}
        </div>

        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        )}
      </div>

      {/* ── Cards ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid sm:grid-cols-2 gap-4"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <InsightCardSkeleton key={i} />
          ))}
        </motion.div>
      ) : !hasData ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center rounded-2xl border border-dashed">
          <Sparkles className="h-8 w-8 text-muted-foreground/25" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">No insights yet</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Generate AI analysis to surface actionable insights
            </p>
          </div>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {cards.map((card, i) => (
            <InsightCard key={i} {...card} />
          ))}
        </motion.div>
      )}
    </div>
  );
}
