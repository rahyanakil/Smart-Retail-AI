'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, AlertTriangle, Brain, TrendingUp,
  Zap, Check, CheckCheck, X, ChevronRight,
  Package, ShieldAlert, Lightbulb, CircleDollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/context/notification-context';
import type { NotificationItem, NotificationCategory, NotificationPriority } from '@/context/notification-context';
import { cn } from '@/lib/utils';

// ── Category config ───────────────────────────────────────────────────────────

interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  iconBg: string;
  iconText: string;
  borderColor: string;
}

const CATEGORY: Record<NotificationCategory, CategoryConfig> = {
  low_stock: {
    label: 'Low Stock',
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    iconText: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-400/70',
  },
  ai_insights: {
    label: 'AI Insights',
    icon: Brain,
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    iconText: 'text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-400/70',
  },
  sales_alert: {
    label: 'Sales Alerts',
    icon: CircleDollarSign,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-400/70',
  },
  system: {
    label: 'System',
    icon: Zap,
    iconBg: 'bg-slate-500/10 dark:bg-slate-500/15',
    iconText: 'text-slate-500 dark:text-slate-400',
    borderColor: 'border-slate-400/50',
  },
};

// Priority → unread left-border colour
const PRIORITY_BORDER: Record<NotificationPriority, string> = {
  high:   'border-l-red-500',
  medium: 'border-l-amber-400',
  low:    'border-l-primary/50',
};

// Priority dot on the icon ring
const PRIORITY_DOT: Record<NotificationPriority, string | null> = {
  high:   'bg-red-500',
  medium: 'bg-amber-400',
  low:    null,
};

// ── Relative time ─────────────────────────────────────────────────────────────

function relTime(iso: string): string {
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

// ── Notification row ──────────────────────────────────────────────────────────

const rowVariants = {
  hidden: { opacity: 0, x: -6 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const } },
  exit:   { opacity: 0, x: 12, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0,
            transition: { duration: 0.22, ease: 'easeIn' as const } },
};

function NotifRow({ item }: { item: NotificationItem }) {
  const { markAsRead, dismiss } = useNotifications();
  const router = useRouter();
  const cfg = CATEGORY[item.category];
  const Icon = cfg.icon;
  const dot = PRIORITY_DOT[item.priority];

  const handleClick = () => {
    markAsRead(item.id);
    if (item.actionUrl) router.push(item.actionUrl);
  };

  return (
    <motion.div
      layout
      variants={rowVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      className={cn(
        'group relative flex items-start gap-3',
        'px-4 py-3.5 cursor-pointer',
        'border-l-2 transition-colors duration-150',
        item.read
          ? 'border-l-transparent hover:bg-accent/50'
          : cn('hover:bg-accent/60', PRIORITY_BORDER[item.priority]),
        !item.read && 'bg-primary/[0.018] dark:bg-primary/[0.04]',
      )}
      onClick={handleClick}
    >
      {/* Category icon */}
      <div className="relative shrink-0 mt-0.5">
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border border-border/40',
          cfg.iconBg,
        )}>
          <Icon className={cn('h-3.5 w-3.5', cfg.iconText)} />
        </div>
        {/* Priority indicator dot */}
        {!item.read && dot && (
          <span className={cn(
            'absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background',
            dot,
            item.priority === 'high' && 'animate-pulse',
          )} />
        )}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 space-y-0.5 pr-6">
        <p className={cn(
          'text-[13px] leading-snug truncate',
          item.read ? 'font-normal text-foreground/80' : 'font-semibold text-foreground',
        )}>
          {item.title}
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {item.description}
        </p>
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          {relTime(item.timestamp)}
        </p>
      </div>

      {/* Dismiss button — appears on hover */}
      <button
        className={cn(
          'absolute right-3 top-3.5 opacity-0 group-hover:opacity-100 transition-opacity',
          'flex h-5 w-5 items-center justify-center rounded-md',
          'text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent',
        )}
        onClick={(e) => { e.stopPropagation(); dismiss(item.id); }}
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>

      {/* Unread dot (right edge) */}
      {!item.read && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shrink-0 group-hover:opacity-0 transition-opacity" />
      )}
    </motion.div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────

const ORDER: NotificationCategory[] = ['low_stock', 'ai_insights', 'sales_alert', 'system'];

function CategorySection({
  category,
  items,
}: {
  category: NotificationCategory;
  items: NotificationItem[];
}) {
  const cfg = CATEGORY[category];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      {/* Group header */}
      <div className="flex items-center justify-between gap-2 px-4 py-2 sticky top-0 bg-popover/95 backdrop-blur-sm z-[1]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {cfg.label}
        </span>
        {unread > 0 && (
          <Badge
            variant="secondary"
            className="text-[9px] h-4 px-1.5 font-semibold"
          >
            {unread} new
          </Badge>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-border/40">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <NotifRow key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <BellOff className="h-5 w-5 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground/70">All caught up</p>
        <p className="text-xs text-muted-foreground/50 mt-0.5">
          No notifications right now
        </p>
      </div>
    </div>
  );
}

// ── Bell button with badge ────────────────────────────────────────────────────

function BellTrigger({ unreadCount, isOpen, onClick }: {
  unreadCount: number;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative h-9 w-9 transition-colors',
        isOpen && 'bg-accent text-accent-foreground',
      )}
      onClick={onClick}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className={cn('h-4 w-4', isOpen && 'fill-current opacity-80')} />

      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-[16px] h-4 items-center justify-center">
          {/* Ping ring for urgency */}
          <span className="absolute h-full w-full animate-ping rounded-full bg-red-500/50" />
          <span className="relative flex min-w-[16px] h-4 items-center justify-center rounded-full bg-red-500 ring-2 ring-background px-1">
            <span className="text-[9px] font-bold text-white leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        </span>
      )}
    </Button>
  );
}

// ── NotificationCenter ────────────────────────────────────────────────────────

export function NotificationCenter() {
  const {
    notifications, unreadCount,
    isOpen, open, close, toggle,
    markAllAsRead,
  } = useNotifications();

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen, close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [isOpen, close]);

  // Build grouped sections (preserve ORDER, skip empty groups)
  const groups = ORDER
    .map((cat) => ({
      category: cat,
      items: notifications.filter((n) => n.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  const hasAnyUnread = unreadCount > 0;

  return (
    <div ref={containerRef} className="relative">
      <BellTrigger
        unreadCount={unreadCount}
        isOpen={isOpen}
        onClick={toggle}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="notif-panel"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
            className={cn(
              'absolute right-0 top-[calc(100%+8px)] z-[48]',
              'w-[380px] max-h-[560px]',
              'rounded-2xl border border-border bg-popover',
              'shadow-2xl shadow-black/20 dark:shadow-black/50',
              'flex flex-col overflow-hidden',
              // Subtle top accent line
              'before:absolute before:inset-x-0 before:top-0 before:h-[1.5px]',
              'before:bg-gradient-to-r before:from-transparent before:via-primary/40 before:to-transparent',
            )}
            role="dialog"
            aria-label="Notifications"
          >
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border/60 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">Notifications</span>
                {hasAnyUnread && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-bold">
                    {unreadCount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {hasAnyUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                  onClick={close}
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border/40">
              {notifications.length === 0 ? (
                <EmptyState />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: {},
                    show: { transition: { staggerChildren: 0.04 } },
                  }}
                >
                  {groups.map(({ category, items }) => (
                    <CategorySection
                      key={category}
                      category={category}
                      items={items}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            {notifications.length > 0 && (
              <div className="shrink-0 border-t border-border/60 px-4 py-2.5 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground/50">
                  {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                  {hasAnyUnread && ` · ${unreadCount} unread`}
                </span>
                <button
                  className="flex items-center gap-1 text-[11px] font-medium text-primary/70 hover:text-primary transition-colors"
                  onClick={close}
                >
                  View activity feed
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
