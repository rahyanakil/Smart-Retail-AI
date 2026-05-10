'use client';

import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, useMemo,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency } from '@/lib/utils';
import type {
  DashboardStats, BusinessInsights, RestockRecommendations,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationCategory =
  | 'low_stock'
  | 'ai_insights'
  | 'sales_alert'
  | 'system';

export type NotificationPriority = 'high' | 'medium' | 'low';

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timestamp: string;       // ISO
  read: boolean;
  priority: NotificationPriority;
  actionUrl?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
}

const Ctx = createContext<NotificationContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

const READS_KEY = 'smartretail-notif-reads';

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READS_KEY, JSON.stringify([...ids]));
  } catch {}
}

// ── Notification builder ──────────────────────────────────────────────────────

function build(
  stats: DashboardStats | undefined,
  insights: BusinessInsights | undefined,
  restock: RestockRecommendations | undefined,
  readIds: Set<string>,
  sessionStart: string,
): NotificationItem[] {
  const items: Omit<NotificationItem, 'read'>[] = [];

  // ── Low stock (per-item) ────────────────────────────────────────────────
  if (stats?.inventory.lowStockItems?.length) {
    stats.inventory.lowStockItems.forEach((p) => {
      const out = p.stock === 0;
      items.push({
        id: `ls_${p.id}`,
        category: 'low_stock',
        title: out ? `Out of stock: ${p.name}` : `Low stock: ${p.name}`,
        description: out
          ? `SKU ${p.sku} · Reorder threshold is ${p.lowStockAlert} units`
          : `${p.stock} unit${p.stock !== 1 ? 's' : ''} left · Threshold: ${p.lowStockAlert}`,
        timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
        priority: out ? 'high' : 'medium',
        actionUrl: '/dashboard/inventory',
      });
    });
  }

  // ── AI restock — critical summary ───────────────────────────────────────
  if (restock && restock.criticalCount > 0) {
    items.push({
      id: `restock_crit_${restock.generatedAt}`,
      category: 'low_stock',
      title: `${restock.criticalCount} critical restock alert${restock.criticalCount !== 1 ? 's' : ''}`,
      description: `AI recommends immediate reorder · Est. ${formatCurrency(restock.totalInvestmentEstimate)} investment`,
      timestamp: restock.generatedAt,
      priority: 'high',
      actionUrl: '/dashboard/ai',
    });
  }

  // ── AI business insights ────────────────────────────────────────────────
  if (insights) {
    const isLow = insights.healthScore < 50;
    const isMed = insights.healthScore < 65;
    items.push({
      id: `ai_health_${insights.generatedAt}`,
      category: 'ai_insights',
      title: `Business Health Score: ${insights.healthScore}/100`,
      description: `${insights.healthLabel} · ${insights.insights.length} insight${insights.insights.length !== 1 ? 's' : ''} · ${insights.risks.length} risk${insights.risks.length !== 1 ? 's' : ''}`,
      timestamp: insights.generatedAt,
      priority: isLow ? 'high' : isMed ? 'medium' : 'low',
      actionUrl: '/dashboard/ai',
    });

    // Surface high-impact risks as individual notifications
    insights.risks.slice(0, 2).forEach((risk, i) => {
      items.push({
        id: `ai_risk_${insights.generatedAt}_${i}`,
        category: 'ai_insights',
        title: 'Business Risk Identified',
        description: risk,
        timestamp: insights.generatedAt,
        priority: 'medium',
        actionUrl: '/dashboard/ai',
      });
    });

    // Top opportunity
    if (insights.opportunities[0]) {
      items.push({
        id: `ai_opp_${insights.generatedAt}_0`,
        category: 'ai_insights',
        title: 'Growth Opportunity',
        description: insights.opportunities[0],
        timestamp: insights.generatedAt,
        priority: 'low',
        actionUrl: '/dashboard/ai',
      });
    }
  }

  // ── Sales alerts ────────────────────────────────────────────────────────
  if (stats?.sales) {
    const { today, todayRevenue, thisMonth, lastMonth } = stats.sales;

    if (today > 0) {
      items.push({
        id: `sales_today_${new Date().toDateString()}`,
        category: 'sales_alert',
        title: `${today} sale${today !== 1 ? 's' : ''} completed today`,
        description: `${formatCurrency(todayRevenue)} revenue generated · ${today} transaction${today !== 1 ? 's' : ''}`,
        timestamp: new Date(Date.now() - 5 * 60_000).toISOString(),
        priority: 'low',
        actionUrl: '/dashboard/sales',
      });
    }

    const growth = stats.revenue.growthPercent;
    if (Math.abs(growth) >= 8) {
      items.push({
        id: `rev_growth_${new Date().toDateString()}`,
        category: 'sales_alert',
        title: growth > 0
          ? `Revenue up ${growth.toFixed(1)}% this month`
          : `Revenue down ${Math.abs(growth).toFixed(1)}% this month`,
        description: `This month: ${formatCurrency(thisMonth)} · Last month: ${formatCurrency(lastMonth)}`,
        timestamp: new Date(Date.now() - 60 * 60_000).toISOString(),
        priority: growth < -15 ? 'high' : growth < 0 ? 'medium' : 'low',
        actionUrl: '/dashboard/analytics',
      });
    }
  }

  // ── System ──────────────────────────────────────────────────────────────
  items.push({
    id: `sys_session_${new Date().toDateString()}`,
    category: 'system',
    title: 'Dashboard session started',
    description: 'All services online · Real-time sync active',
    timestamp: sessionStart,
    priority: 'low',
  });

  // Sort: high-priority first, then newest
  const pOrder: Record<NotificationPriority, number> = { high: 0, medium: 1, low: 2 };
  const sorted = items.sort((a, b) => {
    const pDiff = pOrder[a.priority] - pOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Apply read state
  return sorted.map((n) => ({ ...n, read: readIds.has(n.id) }));
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const sessionStart = useRef(new Date().toISOString()).current;
  const readIdsRef = useRef<Set<string>>(new Set());

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load persisted read IDs once on mount
  useEffect(() => {
    readIdsRef.current = loadReadIds();
  }, []);

  // Rebuild notification list from cache
  const rebuild = useCallback(() => {
    const stats   = qc.getQueryData<DashboardStats>(['activity-feed-stats']);
    const insights = qc.getQueryData<BusinessInsights>(['ai-insights']);
    const restock  = qc.getQueryData<RestockRecommendations>(['ai-restock']);
    setNotifications(build(stats, insights, restock, readIdsRef.current, sessionStart));
  }, [qc, sessionStart]);

  // Initial build + subscribe to cache invalidations
  useEffect(() => {
    rebuild();
    const unsub = qc.getQueryCache().subscribe(() => rebuild());
    return unsub;
  }, [qc, rebuild]);

  const open   = useCallback(() => setIsOpen(true),  []);
  const close  = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((p) => !p), []);

  const markAsRead = useCallback((id: string) => {
    readIdsRef.current = new Set([...readIdsRef.current, id]);
    saveReadIds(readIdsRef.current);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      readIdsRef.current = new Set(next.map((n) => n.id));
      saveReadIds(readIdsRef.current);
      return next;
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    readIdsRef.current = new Set([...readIdsRef.current, id]);
    saveReadIds(readIdsRef.current);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <Ctx.Provider
      value={{
        notifications, unreadCount,
        isOpen, open, close, toggle,
        markAsRead, markAllAsRead, dismiss,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
