'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, Menu, Sun, Moon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { getInitials, ROLE_LABELS } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { useCommandPalette } from '@/context/command-palette-context';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { cn } from '@/lib/utils';

// ── Page title helper ─────────────────────────────────────────────────────────

function usePageTitle(pathname: string): { title: string; sub?: string } {
  if (pathname === '/dashboard')                    return { title: 'Overview',      sub: 'Dashboard' };
  if (pathname.startsWith('/dashboard/pos'))        return { title: 'Point of Sale',  sub: 'Transactions' };
  if (pathname.startsWith('/dashboard/sales'))      return { title: 'Sales History',  sub: 'Records' };
  if (pathname.startsWith('/dashboard/inventory'))  return { title: 'Inventory',      sub: 'Products & Stock' };
  if (pathname.startsWith('/dashboard/users'))      return { title: 'Users',          sub: 'Team Management' };
  if (pathname.startsWith('/dashboard/analytics'))  return { title: 'Analytics',      sub: 'Reports & Charts' };
  if (pathname.startsWith('/dashboard/ai'))         return { title: 'AI Insights',    sub: 'Powered by Gemini' };
  if (pathname.startsWith('/dashboard/copilot'))    return { title: 'AI Copilot',     sub: 'Chat Assistant' };
  if (pathname.startsWith('/dashboard/stores'))     return { title: 'Stores',         sub: 'Location Management' };
  if (pathname.startsWith('/dashboard/settings'))   return { title: 'Settings',       sub: 'Preferences' };
  return { title: 'Dashboard' };
}

interface HeaderProps {
  onMenuClick?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Header({ onMenuClick }: HeaderProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, refreshToken, logout } = useAuthStore();
  const { resolvedTheme, setTheme } = useTheme();
  const { open: openPalette }        = useCommandPalette();
  const { title, sub }               = usePageTitle(pathname ?? '');

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore network errors on logout */ }
    finally {
      logout();
      router.push('/login');
    }
  };

  const toggleTheme = () =>
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  if (!user) return null;

  return (
    <header
      className={cn(
        // Sticky — stays visible while main scrolls independently
        'sticky top-0 z-[30] h-16 shrink-0',
        // Surface + frosted-glass backdrop
        'border-b border-border/60 bg-card/80 backdrop-blur-md',
        // Inner layout
        'flex items-center justify-between px-4 sm:px-6 gap-3',
      )}
    >
      {/* ── Left: hamburger + page title ────────────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 h-9 w-9"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop title + sub */}
        <div className="hidden sm:block min-w-0">
          <h1 className="text-[15px] font-semibold leading-tight truncate tracking-tight">
            {title}
          </h1>
          {sub && (
            <p className="text-[11px] text-muted-foreground/70 leading-tight truncate">
              {sub}
            </p>
          )}
        </div>

        {/* Mobile: title only (no sub) */}
        <span className="sm:hidden text-[15px] font-semibold truncate tracking-tight">
          {title}
        </span>
      </div>

      {/* ── Centre: command palette trigger (desktop only) ───────────────── */}
      <button
        onClick={openPalette}
        className={cn(
          'hidden md:flex flex-1 max-w-[360px] mx-4',
          'items-center gap-2.5 rounded-xl border border-border/60',
          'bg-muted/40 hover:bg-muted/70 hover:border-border',
          'px-3.5 py-2',
          'text-muted-foreground transition-all duration-150 group',
        )}
        aria-label="Open command palette (Ctrl K)"
      >
        <Search className="h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-70 transition-opacity" />
        <span className="flex-1 text-left text-[13px] leading-none">
          Search or jump to…
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground shadow-sm">
            Ctrl
          </kbd>
          <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground shadow-sm">
            K
          </kbd>
        </div>
      </button>

      {/* ── Right: actions ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openPalette}
          className="md:hidden h-9 w-9"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label={resolvedTheme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          {resolvedTheme === 'dark'
            ? <Sun  className="h-4 w-4" />
            : <Moon className="h-4 w-4" />
          }
        </Button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 ring-offset-background transition-all duration-150 hover:ring-2 hover:ring-border"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground mt-0.5">
                  {user.email}
                </p>
                <Badge variant="secondary" className="w-fit mt-1.5 text-xs">
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile & Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
