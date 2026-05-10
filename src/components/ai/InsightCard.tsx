'use client';

import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

export type InsightAccent = 'blue' | 'amber' | 'red' | 'emerald' | 'violet';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface InsightCardProps {
  icon: React.ElementType;
  categoryLabel: string;
  title: string;
  summary: string;
  confidence: number;    // 0–100
  priority: InsightPriority;
  timestamp: string;     // ISO string
  action?: string;       // CTA label (omit to hide)
  accent: InsightAccent;
}

// ── Color maps ────────────────────────────────────────────────────────────────

const ACCENT: Record<InsightAccent, {
  iconBg: string; iconText: string; border: string;
  glow: string; labelText: string; confBar: string;
}> = {
  blue: {
    iconBg:    'bg-blue-500/10 dark:bg-blue-500/15',
    iconText:  'text-blue-600 dark:text-blue-400',
    border:    'border-blue-300/60 dark:border-blue-700/40',
    glow:      'to-blue-500/[0.04]',
    labelText: 'text-blue-600 dark:text-blue-400',
    confBar:   'from-blue-400 to-blue-600',
  },
  amber: {
    iconBg:    'bg-amber-500/10 dark:bg-amber-500/15',
    iconText:  'text-amber-600 dark:text-amber-400',
    border:    'border-amber-300/60 dark:border-amber-700/40',
    glow:      'to-amber-500/[0.04]',
    labelText: 'text-amber-600 dark:text-amber-400',
    confBar:   'from-amber-400 to-amber-600',
  },
  red: {
    iconBg:    'bg-red-500/10 dark:bg-red-500/15',
    iconText:  'text-red-600 dark:text-red-400',
    border:    'border-red-300/60 dark:border-red-700/40',
    glow:      'to-red-500/[0.04]',
    labelText: 'text-red-600 dark:text-red-400',
    confBar:   'from-red-400 to-red-600',
  },
  emerald: {
    iconBg:    'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconText:  'text-emerald-600 dark:text-emerald-400',
    border:    'border-emerald-300/60 dark:border-emerald-700/40',
    glow:      'to-emerald-500/[0.04]',
    labelText: 'text-emerald-600 dark:text-emerald-400',
    confBar:   'from-emerald-400 to-emerald-600',
  },
  violet: {
    iconBg:    'bg-violet-500/10 dark:bg-violet-500/15',
    iconText:  'text-violet-600 dark:text-violet-400',
    border:    'border-violet-300/60 dark:border-violet-700/40',
    glow:      'to-violet-500/[0.04]',
    labelText: 'text-violet-600 dark:text-violet-400',
    confBar:   'from-violet-400 to-violet-600',
  },
};

const PRIORITY: Record<InsightPriority, {
  variant: 'destructive' | 'warning' | 'info' | 'secondary';
  label: string;
  dot: string;
}> = {
  critical: { variant: 'destructive', label: 'Critical', dot: 'bg-red-500 animate-pulse' },
  high:     { variant: 'destructive', label: 'High',     dot: 'bg-red-400' },
  medium:   { variant: 'warning',     label: 'Medium',   dot: 'bg-amber-400' },
  low:      { variant: 'secondary',   label: 'Low',      dot: 'bg-slate-400 dark:bg-slate-500' },
};

// ── Card animation variants (exported for panel stagger) ──────────────────────

export const insightCardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.975 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.38, ease: [0.23, 1, 0.32, 1] as const },
  },
};

// ── Confidence bar ─────────────────────────────────────────────────────────────

function ConfidenceBar({ value, barGradient }: { value: number; barGradient: string }) {
  const barColor =
    value >= 80 ? 'from-emerald-400 to-green-500' :
    value >= 60 ? barGradient :
    value >= 40 ? 'from-amber-400 to-amber-500' :
                  'from-red-400 to-red-500';

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', barColor)}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-muted-foreground w-8 text-right">
        {value}%
      </span>
    </div>
  );
}

// ── Relative timestamp ────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  } catch {
    return '';
  }
}

// ── InsightCard ───────────────────────────────────────────────────────────────

export function InsightCard({
  icon: Icon, categoryLabel, title, summary,
  confidence, priority, timestamp, action, accent,
}: InsightCardProps) {
  const a = ACCENT[accent];
  const p = PRIORITY[priority];

  return (
    <motion.div
      variants={insightCardVariants}
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={cn(
        'group relative flex flex-col rounded-2xl border bg-card',
        'p-5 overflow-hidden cursor-default',
        'shadow-sm hover:shadow-xl transition-shadow duration-300',
        a.border
      )}
    >
      {/* Ambient glow on hover */}
      <div className={cn(
        'pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100',
        'transition-opacity duration-500',
        'bg-gradient-to-br from-transparent via-transparent', a.glow
      )} />

      {/* ── Top row: icon + category label + priority badge ──────────────── */}
      <div className="relative flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            'border border-border/40', a.iconBg
          )}>
            <Icon className={cn('h-[18px] w-[18px]', a.iconText)} />
          </div>
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest', a.labelText
          )}>
            {categoryLabel}
          </span>
        </div>

        <Badge
          variant={p.variant}
          className="text-[10px] px-2 py-0.5 gap-1.5 font-semibold shrink-0"
        >
          <span className={cn('h-1.5 w-1.5 rounded-full inline-block', p.dot)} />
          {p.label}
        </Badge>
      </div>

      {/* ── Title + summary ──────────────────────────────────────────────── */}
      <div className="relative flex-1 mb-4 space-y-2">
        <h3 className="text-sm font-bold leading-snug tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{summary}</p>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="relative h-px bg-border/60 mb-3.5" />

      {/* ── Confidence section ────────────────────────────────────────────── */}
      <div className="relative space-y-1.5 mb-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          AI Confidence
        </span>
        <ConfidenceBar value={confidence} barGradient={a.confBar} />
      </div>

      {/* ── Footer: timestamp + CTA ───────────────────────────────────────── */}
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/55">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{relativeTime(timestamp)}</span>
        </div>
        {action && (
          <button className={cn(
            'flex items-center gap-1 text-[11px] font-semibold transition-colors',
            a.labelText, 'opacity-70 group-hover:opacity-100'
          )}>
            {action}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
