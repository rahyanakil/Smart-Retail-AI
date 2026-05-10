'use client';

/**
 * Production-grade skeleton loaders for SmartRetail AI.
 *
 * Every component is pixel-matched to the real layout it replaces, so
 * there is zero content-layout-shift when data arrives.
 *
 * Pattern for smooth reveal transitions:
 *   <AnimatePresence mode="wait">
 *     {loading ? (
 *       <motion.div key="sk" exit={{ opacity: 0 }}><TableSkeleton /></motion.div>
 *     ) : (
 *       <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
 *         <ActualTable />
 *       </motion.div>
 *     )}
 *   </AnimatePresence>
 */

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ── Shared helpers ────────────────────────────────────────────────────────────

/** Staggered opacity — gives rows a natural depth fade. */
const rowOpacity = (i: number, total: number) =>
  ({ opacity: 1 - (i / total) * 0.45 }) as React.CSSProperties;

/** Shimmer overlay reused inside SVG-based chart shapes. */
function SvgShimmerOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, var(--sk-shimmer) 50%, transparent 100%)',
      }}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 1 — Dashboard Card Skeleton
//     Matches the KpiCard component in dashboard/page.tsx
// ══════════════════════════════════════════════════════════════════════════════

export interface DashboardCardSkeletonProps {
  className?: string;
}

export function DashboardCardSkeleton({ className }: DashboardCardSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-5 py-5 space-y-4 overflow-hidden',
        className,
      )}
    >
      {/* Header row: label + icon square */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>

      {/* Value + sub text */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>

      {/* Trend pill */}
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
  );
}

/** Four-column KPI strip — mirrors the dashboard page grid. */
export function KpiGridSkeleton({
  count = 4,
  className,
}: {
  count?: 2 | 4;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        count === 4 ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-2',
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <DashboardCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 2 — Table Skeleton
//     Configurable rows × columns with search bar and pagination.
// ══════════════════════════════════════════════════════════════════════════════

export interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  className?: string;
}

// Approximate widths so the skeleton mirrors a real data table.
const COL_WIDTHS = [
  'w-40',  // primary / name col
  'w-24',  // secondary
  'w-28',  // tertiary
  'w-20',  // status badge
  'w-16',  // amount / action
  'w-12',  // tiny
];

// Row-level cell widths vary slightly for a natural look.
const cellWidth = (col: number, row: number): string => {
  const base = COL_WIDTHS[col] ?? 'w-20';
  if (col === 0) {
    const variants = ['w-36', 'w-44', 'w-32', 'w-40', 'w-48'];
    return variants[row % variants.length];
  }
  return base;
};

export function TableSkeleton({
  rows = 8,
  cols = 5,
  showSearch = true,
  showPagination = true,
  className,
}: TableSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search + filter toolbar */}
      {showSearch && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </div>
      )}

      {/* Table container */}
      <div className="rounded-xl border overflow-hidden bg-card">
        {/* Column headers */}
        <div className="flex items-center gap-4 px-4 py-3 border-b bg-muted/40">
          <Skeleton className="h-3 flex-1 max-w-[10rem]" />
          {Array.from({ length: cols - 1 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('h-3 shrink-0', COL_WIDTHS[i + 1] ?? 'w-20')}
            />
          ))}
        </div>

        {/* Data rows */}
        <div className="divide-y divide-border/60">
          {Array.from({ length: rows }).map((_, row) => (
            <div
              key={row}
              className="flex items-center gap-4 px-4 py-3.5"
              style={rowOpacity(row, rows)}
            >
              {/* First col — wide, with a tiny avatar-like circle sometimes */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {row % 4 === 0 && (
                  <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                )}
                <Skeleton className={cellWidth(0, row)} />
              </div>

              {/* Remaining cols */}
              {Array.from({ length: cols - 1 }).map((_, col) => (
                <Skeleton
                  key={col}
                  className={cn(
                    'shrink-0',
                    // Last column: small rounded badge shape
                    col === cols - 2
                      ? cn('h-5 rounded-full', COL_WIDTHS[col + 1] ?? 'w-16')
                      : cn('h-3.5', cellWidth(col + 1, row)),
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination bar */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-40" />
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  'h-8 w-8 rounded-lg',
                  i === 2 && 'w-10', // current page pill slightly wider
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 3 — Chart Skeleton
//     Three variants: bar | area | composed (line + bar)
//     All share the same card shell and axes skeleton.
// ══════════════════════════════════════════════════════════════════════════════

export interface ChartSkeletonProps {
  variant?: 'bar' | 'area' | 'composed';
  height?: number;
  showHeader?: boolean;
  showLegend?: boolean;
  showPeriodPicker?: boolean;
  barCount?: number;
  className?: string;
}

// Pre-set bar heights that look like real sales data (not uniform).
const BAR_HEIGHTS = [52, 68, 44, 88, 60, 96, 72, 55, 80, 46, 76, 63];

function BarChartBody({ count, height }: { count: number; height: number }) {
  const bars = BAR_HEIGHTS.slice(0, count);
  return (
    <div className="flex items-end gap-[3px] w-full" style={{ height }}>
      {bars.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <Skeleton
            className="w-full rounded-t-[3px]"
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
    </div>
  );
}

function AreaChartBody({ height }: { height: number }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {/* Mountain-wave SVG fill */}
      <svg
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Area fill */}
        <path
          d="M0,68 C30,62 50,44 90,50 C130,56 155,28 200,36 C245,44 270,20 320,30 C355,38 380,26 400,32 L400,100 L0,100 Z"
          className="fill-muted"
        />
        {/* Stroke line */}
        <path
          d="M0,68 C30,62 50,44 90,50 C130,56 155,28 200,36 C245,44 270,20 320,30 C355,38 380,26 400,32"
          fill="none"
          strokeWidth="2"
          className="stroke-muted-foreground/15"
        />
        {/* Data-point dots */}
        {([
          [0,68],[90,50],[155,28],[200,36],[270,20],[320,30],[400,32],
        ] as [number, number][]).map(([x, y], i) => (
          <circle
            key={i}
            cx={x} cy={y} r={3}
            className="fill-muted stroke-muted-foreground/20"
            strokeWidth="2"
          />
        ))}
      </svg>
      {/* Shimmer on top of SVG */}
      <SvgShimmerOverlay />
    </div>
  );
}

function ComposedChartBody({ height }: { height: number }) {
  const bars = BAR_HEIGHTS.slice(0, 7);
  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      {/* Area fill behind bars */}
      <svg
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <path
          d="M0,72 C55,62 110,40 165,48 C220,56 275,24 330,34 C365,40 385,28 400,32 L400,100 L0,100 Z"
          className="fill-muted/50"
        />
        <path
          d="M0,72 C55,62 110,40 165,48 C220,56 275,24 330,34 C365,40 385,28 400,32"
          fill="none"
          strokeWidth="1.5"
          className="stroke-muted-foreground/15"
        />
      </svg>

      {/* Bars on top */}
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-[3px] px-0.5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <Skeleton
              className="w-full rounded-t-sm opacity-80"
              style={{ height: `${Math.round(h * 0.55)}%` }}
            />
          </div>
        ))}
      </div>
      <SvgShimmerOverlay />
    </div>
  );
}

export function ChartSkeleton({
  variant = 'bar',
  height = 260,
  showHeader = true,
  showLegend = true,
  showPeriodPicker = true,
  barCount = 10,
  className,
}: ChartSkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-5 py-5 space-y-5 overflow-hidden',
        className,
      )}
    >
      {/* Card header */}
      {showHeader && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
          {showPeriodPicker && (
            <div className="flex gap-1.5 shrink-0">
              {['7D', '30D', '90D'].map((p) => (
                <Skeleton key={p} className="h-7 w-9 rounded-md" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plot area with Y-axis */}
      <div className="flex gap-3">
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between shrink-0 pb-6"
          style={{ width: 36 }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-2.5"
              style={{ width: i % 2 === 0 ? 32 : 24 }}
            />
          ))}
        </div>

        {/* Chart + X-axis */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Horizontal grid lines — subtle background */}
          <div
            className="relative w-full border-b border-border/40"
            style={{ height }}
          >
            {/* Ghost grid lines */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-border/20"
                style={{ top: `${(i + 1) * 20}%` }}
              />
            ))}

            {/* The chart body */}
            <div className="absolute inset-0">
              {variant === 'bar'      && <BarChartBody count={barCount} height={height} />}
              {variant === 'area'     && <AreaChartBody height={height} />}
              {variant === 'composed' && <ComposedChartBody height={height} />}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex items-center justify-between px-0.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-2.5"
                style={{ width: i % 3 === 0 ? 22 : 16 }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-5 pt-1">
          {[28, 20].map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Skeleton className="h-2.5 w-2.5 rounded-full" />
              <Skeleton className={`h-2.5 w-${w}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 4 — Sidebar Skeleton
//     Pixel-matched to the Sidebar component (logo, nav items, store badge).
// ══════════════════════════════════════════════════════════════════════════════

export interface SidebarSkeletonProps {
  navCount?: number;
  className?: string;
}

// Nav-item label widths vary just like real nav labels.
const NAV_LABEL_WIDTHS = [56, 76, 72, 60, 40, 52, 60, 56, 32, 44];

export function SidebarSkeleton({
  navCount = 8,
  className,
}: SidebarSkeletonProps) {
  return (
    <aside
      className={cn(
        'flex flex-col w-64 h-screen shrink-0',
        'bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]',
        className,
      )}
    >
      {/* Logo area */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--sidebar-border))] px-5">
        <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-hidden px-3 py-4 space-y-0.5">
        {Array.from({ length: navCount }).map((_, i) => {
          const isHighlighted = i === 1 || i === 7;
          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md',
                isHighlighted && 'border border-dashed border-border/60',
              )}
              style={rowOpacity(i, navCount)}
            >
              <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
              <Skeleton
                className="h-3"
                style={{ width: NAV_LABEL_WIDTHS[i % NAV_LABEL_WIDTHS.length] }}
              />
              {/* Active indicator on first item */}
              {i === 0 && (
                <Skeleton className="ml-auto h-3 w-3 rounded-sm" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Store badge */}
      <div className="shrink-0 px-3 pb-4">
        <div className="rounded-lg border border-[hsl(var(--sidebar-border))] bg-muted/50 px-3 py-3 space-y-1.5">
          <Skeleton className="h-2 w-20" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2.5 w-48" />
        </div>
      </div>
    </aside>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// 5 — Analytics Page Skeleton
//     Full-page loading state for /dashboard/analytics.
//     Section order matches the real page exactly.
// ══════════════════════════════════════════════════════════════════════════════

export interface AnalyticsPageSkeletonProps {
  className?: string;
}

/** Top-products list skeleton — right column of the analytics page. */
function TopProductsSkeleton() {
  return (
    <div className="rounded-xl border bg-card px-5 py-5 space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>

      {/* Product rows */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5" style={rowOpacity(i, 6)}>
            <div className="flex items-center justify-between gap-2">
              {/* Rank badge + name */}
              <div className="flex items-center gap-2 min-w-0">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className={cn('h-3.5', i % 2 === 0 ? 'w-32' : 'w-24')} />
              </div>
              <Skeleton className="h-3.5 w-16 shrink-0" />
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <Skeleton
                className="h-1.5 flex-1 rounded-full"
                style={{ maxWidth: `${95 - i * 12}%` }}
              />
              <Skeleton className="h-2.5 w-14 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPageSkeleton({ className }: AnalyticsPageSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-3.5 w-72" />
        </div>
        <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
      </div>

      {/* KPI strip */}
      <KpiGridSkeleton count={4} />

      {/* Primary chart — full width */}
      <ChartSkeleton variant="composed" height={290} />

      {/* Second row: revenue chart + top products */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ChartSkeleton
            variant="bar"
            height={220}
            showLegend={false}
            showPeriodPicker={false}
          />
        </div>
        <div className="lg:col-span-2">
          <TopProductsSkeleton />
        </div>
      </div>

      {/* Third row: table */}
      <TableSkeleton rows={6} cols={4} showSearch showPagination={false} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Bonus — Reusable building blocks
// ══════════════════════════════════════════════════════════════════════════════

/** Generic card with configurable content lines — suits any Card component. */
export function CardSkeleton({
  lines = 3,
  showAvatar = false,
  showAction = false,
  className,
}: {
  lines?: number;
  showAvatar?: boolean;
  showAction?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card px-5 py-5 space-y-4 overflow-hidden',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full shrink-0 mt-0.5" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('h-3', i === lines - 1 ? 'w-2/5' : 'w-full')}
            />
          ))}
        </div>
        {showAction && (
          <Skeleton className="h-8 w-20 rounded-lg shrink-0" />
        )}
      </div>
    </div>
  );
}

/** Row skeleton for sales / activity tables — with left avatar and right badge. */
export function SaleRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5"
          style={rowOpacity(i, rows)}
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <Skeleton className={cn('h-3.5', i % 3 === 0 ? 'w-28' : 'w-24')} />
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
