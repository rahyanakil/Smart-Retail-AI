'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, ScanLine, Warehouse,
  Users, BarChart3, Store, Settings, ChevronRight,
  Sparkles, BotMessageSquare, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

// ── Nav definition ────────────────────────────────────────────────────────────

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
  highlight?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard',            label: 'Overview',       icon: LayoutDashboard, roles: ['ADMIN','OWNER','CASHIER'] },
  { href: '/dashboard/pos',        label: 'Point of Sale',  icon: ScanLine,        roles: ['ADMIN','OWNER','CASHIER'], highlight: true },
  { href: '/dashboard/sales',      label: 'Sales History',  icon: ShoppingCart,    roles: ['ADMIN','OWNER','CASHIER'] },
  { href: '/dashboard/inventory',  label: 'Inventory',      icon: Warehouse,       roles: ['ADMIN','OWNER'] },
  { href: '/dashboard/users',      label: 'Users',          icon: Users,           roles: ['ADMIN','OWNER'] },
  { href: '/dashboard/analytics',  label: 'Analytics',      icon: BarChart3,       roles: ['ADMIN','OWNER'] },
  { href: '/dashboard/ai',         label: 'AI Insights',    icon: Sparkles,        roles: ['ADMIN','OWNER'] },
  { href: '/dashboard/copilot',    label: 'AI Copilot',     icon: BotMessageSquare,roles: ['ADMIN','OWNER','CASHIER'], highlight: true },
  { href: '/dashboard/stores',     label: 'Stores',         icon: Store,           roles: ['ADMIN'] },
  { href: '/dashboard/settings',   label: 'Settings',       icon: Settings,        roles: ['ADMIN','OWNER','CASHIER'] },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const filtered = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        // Base positioning + dimensions
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col',
        // Background + border
        'bg-[hsl(var(--sidebar))] border-r border-[hsl(var(--sidebar-border))]',
        // Shadow on mobile only
        'shadow-xl md:shadow-none',
        // Mobile slide transition — iOS-style cubic bezier for snappy feel
        '[transition:transform_220ms_cubic-bezier(0.32,0.72,0,1)]',
        // Desktop — always visible, no transform needed
        'md:relative md:z-auto md:w-64 md:[transition:none] md:translate-x-0',
        // Mobile — toggle via isOpen
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* ── Logo ───────────────────────────────────────────────────────── */}
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-[hsl(var(--sidebar-border))] px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-sm shadow-primary/30">
            <Store className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-[15px] tracking-tight truncate">SmartRetail</span>
        </div>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5" role="navigation">
        {/* Section divider helper — adds a small gap between nav groups */}
        {filtered.map((item, idx) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          // Insert a subtle visual separator before "Settings" group
          const showDivider = idx > 0 && item.href === '/dashboard/settings';

          return (
            <div key={item.href}>
              {showDivider && (
                <div className="my-2 mx-3 h-px bg-[hsl(var(--sidebar-border))]" />
              )}

              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5',
                  'text-sm font-medium',
                  'transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 dark:bg-primary/15 text-primary font-semibold'
                    : item.highlight
                    ? [
                        'text-foreground/80',
                        'border border-dashed border-border/70 hover:border-primary/25',
                        'hover:bg-primary/8 dark:hover:bg-primary/10 hover:text-primary',
                      ].join(' ')
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* Left accent bar for active item */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary"
                  />
                )}

                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive
                      ? 'text-primary'
                      : 'text-current opacity-70 group-hover:opacity-100 transition-opacity duration-150',
                  )}
                />
                <span className="flex-1 truncate">{item.label}</span>

                {isActive && (
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* ── Store badge ─────────────────────────────────────────────────── */}
      {user?.store && (
        <div className="shrink-0 px-2.5 pb-4">
          <div className="rounded-xl border border-[hsl(var(--sidebar-border))] bg-muted/40 px-3 py-3 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Active Store
            </p>
            <p className="text-sm font-semibold truncate leading-snug">{user.store.name}</p>
            {user.store.address && (
              <p className="text-[11px] text-muted-foreground/70 truncate leading-snug">
                {user.store.address}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
