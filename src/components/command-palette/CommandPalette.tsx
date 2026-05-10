'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import {
  Search, Package, ShoppingCart, BarChart3, Warehouse, Users,
  BotMessageSquare, Sun, Moon, LogOut, Settings, LayoutDashboard,
  Store, Sparkles, ScanLine, History, Brain, X, ArrowRight,
  ChevronRight, Zap,
} from 'lucide-react';
import { useCommandPalette } from '@/context/command-palette-context';
import { useCopilotDrawer } from '@/context/copilot-context';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/theme-provider';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Role } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Accent = 'blue' | 'emerald' | 'violet' | 'amber' | 'sky' | 'rose' | 'slate' | 'primary';

interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  accent: Accent;
  shortcut?: string[];
  roles?: Role[];
  onSelect: () => void;
}

interface CommandGroup {
  id: string;
  heading: string;
  actions: CommandAction[];
}

// ── Accent map ────────────────────────────────────────────────────────────────

const ACCENT_CLASSES: Record<Accent, { bg: string; text: string; ring: string }> = {
  blue:    { bg: 'bg-blue-500/10 dark:bg-blue-500/15',    text: 'text-blue-600 dark:text-blue-400',    ring: 'ring-blue-500/20' },
  emerald: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/20' },
  violet:  { bg: 'bg-violet-500/10 dark:bg-violet-500/15',  text: 'text-violet-600 dark:text-violet-400',  ring: 'ring-violet-500/20' },
  amber:   { bg: 'bg-amber-500/10 dark:bg-amber-500/15',   text: 'text-amber-600 dark:text-amber-400',   ring: 'ring-amber-500/20' },
  sky:     { bg: 'bg-sky-500/10 dark:bg-sky-500/15',       text: 'text-sky-600 dark:text-sky-400',       ring: 'ring-sky-500/20' },
  rose:    { bg: 'bg-rose-500/10 dark:bg-rose-500/15',     text: 'text-rose-600 dark:text-rose-400',     ring: 'ring-rose-500/20' },
  slate:   { bg: 'bg-slate-500/10 dark:bg-slate-500/15',   text: 'text-slate-600 dark:text-slate-400',   ring: 'ring-slate-500/20' },
  primary: { bg: 'bg-primary/10',                          text: 'text-primary',                          ring: 'ring-primary/20' },
};

// ── Kbd chip ──────────────────────────────────────────────────────────────────

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 text-[10px] font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

// ── Command item row ──────────────────────────────────────────────────────────

function PaletteItem({ action, onSelect }: { action: CommandAction; onSelect: () => void }) {
  const Icon = action.icon;
  const accent = ACCENT_CLASSES[action.accent];

  return (
    <Command.Item
      key={action.id}
      value={`${action.label} ${action.description ?? ''}`}
      onSelect={onSelect}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer',
        'data-[selected=true]:bg-accent',
        'transition-colors duration-100 outline-none'
      )}
    >
      {/* Icon container */}
      <div className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
        'border border-border/40',
        accent.bg
      )}>
        <Icon className={cn('h-4 w-4', accent.text)} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-none truncate">{action.label}</p>
        {action.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.description}</p>
        )}
      </div>

      {/* Shortcut keys */}
      {action.shortcut && (
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {action.shortcut.map((k) => <Kbd key={k}>{k}</Kbd>)}
        </div>
      )}

      {/* Arrow indicator */}
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0 group-data-[selected=true]:text-muted-foreground transition-colors" />
    </Command.Item>
  );
}

// ── Command group section ─────────────────────────────────────────────────────

function PaletteGroup({ group }: { group: CommandGroup }) {
  if (group.actions.length === 0) return null;
  return (
    <Command.Group>
      <div className="px-3 pb-1 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {group.heading}
        </span>
      </div>
      {group.actions.map((action) => (
        <PaletteItem key={action.id} action={action} onSelect={action.onSelect} />
      ))}
    </Command.Group>
  );
}

// ── Main CommandPalette ───────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { open: openCopilot } = useCopilotDrawer();
  const { user, refreshToken, logout } = useAuthStore();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const go = useCallback((href: string) => {
    router.push(href);
    close();
  }, [router, close]);

  const handleLogout = useCallback(async () => {
    close();
    try { if (refreshToken) await authApi.logout(refreshToken); } catch {}
    logout();
    router.push('/login');
  }, [close, refreshToken, logout, router]);

  // Auto-focus input when palette opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // ── Command definitions ─────────────────────────────────────────────────────

  const hasRole = (...roles: Role[]) => user ? roles.includes(user.role) : false;

  const allQuickActions: CommandAction[] = [
    { id: 'add-product',      label: 'Add Product',       description: 'Create a new product in inventory', icon: Package,       accent: 'emerald', shortcut: ['A','P'], roles: ['ADMIN','OWNER'], onSelect: () => go('/dashboard/inventory') },
    { id: 'create-sale',      label: 'Create Sale',        description: 'Open the Point of Sale terminal',  icon: ShoppingCart,  accent: 'blue',    shortcut: ['C','S'],               onSelect: () => go('/dashboard/pos') },
    { id: 'view-analytics',   label: 'View Analytics',     description: 'Sales trends, charts and reports', icon: BarChart3,     accent: 'violet',                   roles: ['ADMIN','OWNER'], onSelect: () => go('/dashboard/analytics') },
    { id: 'open-inventory',   label: 'Open Inventory',     description: 'Browse and manage stock levels',   icon: Warehouse,     accent: 'amber',                    roles: ['ADMIN','OWNER'], onSelect: () => go('/dashboard/inventory') },
    { id: 'search-customers', label: 'Search Customers',   description: 'Find and manage store users',      icon: Users,         accent: 'sky',                      roles: ['ADMIN','OWNER'], onSelect: () => go('/dashboard/users') },
  ];
  const quickActions = allQuickActions.filter((a) => !a.roles || hasRole(...a.roles));

  const allNavigation: CommandAction[] = [
    { id: 'nav-overview',  label: 'Overview',       description: 'Dashboard home',          icon: LayoutDashboard,  accent: 'slate',   roles: ['ADMIN','OWNER','CASHIER'], onSelect: () => go('/dashboard') },
    { id: 'nav-pos',       label: 'Point of Sale',  description: 'Process transactions',    icon: ScanLine,         accent: 'blue',    roles: ['ADMIN','OWNER','CASHIER'], onSelect: () => go('/dashboard/pos') },
    { id: 'nav-sales',     label: 'Sales History',  description: 'Past transactions',       icon: History,          accent: 'emerald', roles: ['ADMIN','OWNER','CASHIER'], onSelect: () => go('/dashboard/sales') },
    { id: 'nav-inventory', label: 'Inventory',      description: 'Manage products & stock', icon: Warehouse,        accent: 'amber',   roles: ['ADMIN','OWNER'],           onSelect: () => go('/dashboard/inventory') },
    { id: 'nav-users',     label: 'Users',          description: 'Manage team members',     icon: Users,            accent: 'sky',     roles: ['ADMIN','OWNER'],           onSelect: () => go('/dashboard/users') },
    { id: 'nav-analytics', label: 'Analytics',      description: 'Charts and KPIs',         icon: BarChart3,        accent: 'violet',  roles: ['ADMIN','OWNER'],           onSelect: () => go('/dashboard/analytics') },
    { id: 'nav-ai',        label: 'AI Insights',    description: 'Gemini-powered analysis', icon: Brain,            accent: 'violet',  roles: ['ADMIN','OWNER'],           onSelect: () => go('/dashboard/ai') },
    { id: 'nav-copilot',   label: 'AI Copilot',     description: 'Chat with your store AI', icon: BotMessageSquare, accent: 'primary', roles: ['ADMIN','OWNER','CASHIER'], onSelect: () => go('/dashboard/copilot') },
    { id: 'nav-stores',    label: 'Stores',         description: 'Manage store locations',  icon: Store,            accent: 'slate',   roles: ['ADMIN'],                   onSelect: () => go('/dashboard/stores') },
    { id: 'nav-settings',  label: 'Settings',       description: 'Account and preferences', icon: Settings,         accent: 'slate',   roles: ['ADMIN','OWNER','CASHIER'], onSelect: () => go('/dashboard/settings') },
  ];
  const navigation = allNavigation.filter((a) => !a.roles || hasRole(...a.roles));

  const tools: CommandAction[] = [
    {
      id: 'open-copilot',
      label: 'Open AI Copilot',
      description: 'Ask anything about your store',
      icon: Sparkles,
      accent: 'primary',
      onSelect: () => { close(); openCopilot(); },
    },
    {
      id: 'toggle-theme',
      label: resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      description: 'Toggle appearance',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      accent: 'amber',
      onSelect: () => { setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'); close(); },
    },
  ];

  const account: CommandAction[] = [
    {
      id: 'settings',
      label: 'Profile & Settings',
      description: user?.email ?? '',
      icon: Settings,
      accent: 'slate',
      onSelect: () => go('/dashboard/settings'),
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      description: 'End your current session',
      icon: LogOut,
      accent: 'rose',
      onSelect: handleLogout,
    },
  ];

  const groups: CommandGroup[] = [
    { id: 'quick',      heading: 'Quick Actions', actions: quickActions },
    { id: 'navigation', heading: 'Navigation',    actions: navigation   },
    { id: 'tools',      heading: 'Tools',         actions: tools        },
    { id: 'account',    heading: 'Account',       actions: account      },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ────────────────────────────────────────────────────── */}
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-[3px]"
            aria-hidden="true"
          />

          {/* ── Panel ───────────────────────────────────────────────────────── */}
          <motion.div
            key="palette-panel"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.6 }}
            className={cn(
              'fixed left-1/2 top-[12vh] z-[71] -translate-x-1/2',
              'w-full max-w-[620px] mx-4',
              'rounded-2xl border border-border bg-background shadow-2xl shadow-black/30',
              'overflow-hidden flex flex-col',
              'max-h-[72vh]'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent shrink-0" />

            {/* ── Search input ─────────────────────────────────────────────── */}
            <Command
              className="flex flex-col overflow-hidden bg-transparent"
              shouldFilter
              loop
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <Command.Input
                  ref={inputRef}
                  placeholder="Search actions, pages, and more…"
                  className={cn(
                    'flex-1 bg-transparent text-sm outline-none',
                    'placeholder:text-muted-foreground/60',
                    'text-foreground caret-primary'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { e.preventDefault(); close(); }
                  }}
                />
                <button
                  onClick={close}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* ── Results ──────────────────────────────────────────────────── */}
              <Command.List className="flex-1 overflow-y-auto overscroll-contain px-2 py-2 space-y-0.5">
                <Command.Empty className="flex flex-col items-center gap-2 py-12 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/30" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No results found</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Try searching for a page or action</p>
                  </div>
                </Command.Empty>

                {groups.map((group) => (
                  <PaletteGroup key={group.id} group={group} />
                ))}
              </Command.List>

              {/* ── Footer ───────────────────────────────────────────────────── */}
              <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-2.5 shrink-0 bg-muted/30">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Kbd>↑</Kbd><Kbd>↓</Kbd>
                    <span className="ml-0.5">navigate</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Kbd>↵</Kbd>
                    <span className="ml-0.5">select</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Kbd>Esc</Kbd>
                    <span className="ml-0.5">close</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 shrink-0">
                  <Zap className="h-3 w-3" />
                  <span>SmartRetail AI</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
