'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

interface AuthGuardProps {
  /** Require one of these roles. Omit to only require authentication. */
  roles?: Role[];
  /** What to render while the Zustand store rehydrates from localStorage. */
  fallback?: React.ReactNode;
  /** Where to redirect unauthenticated users. Defaults to '/login'. */
  loginPath?: string;
  /** Where to redirect authenticated users who lack the required role. */
  unauthorizedPath?: string;
  children: React.ReactNode;
}

/**
 * Client-side authentication + authorisation guard.
 *
 * Works alongside the Next.js Edge middleware (`middleware.ts`) which provides
 * the server-side layer. This component is the client-side safety net for the
 * brief hydration window before the middleware cookie is fully in sync.
 *
 * @example
 * // Protect a page — any authenticated user
 * <AuthGuard>
 *   <DashboardContent />
 * </AuthGuard>
 *
 * @example
 * // Protect a section — admins only
 * <AuthGuard roles={['ADMIN']} unauthorizedPath="/dashboard">
 *   <AdminPanel />
 * </AuthGuard>
 */
export function AuthGuard({
  roles,
  fallback,
  loginPath = '/login',
  unauthorizedPath = '/dashboard',
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const redirected = useRef(false);

  useEffect(() => {
    if (!isHydrated || redirected.current) return;

    if (!isAuthenticated) {
      redirected.current = true;
      router.replace(loginPath);
      return;
    }

    if (roles && user && !roles.includes(user.role)) {
      redirected.current = true;
      router.replace(unauthorizedPath);
    }
  }, [isAuthenticated, isHydrated, user, roles, router, loginPath, unauthorizedPath]);

  // While localStorage is rehydrating, show the fallback
  if (!isHydrated) {
    return (
      fallback ?? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )
    );
  }

  // Not authenticated — render nothing while redirect fires
  if (!isAuthenticated) return null;

  // Wrong role — render nothing while redirect fires
  if (roles && user && !roles.includes(user.role)) return null;

  return <>{children}</>;
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/** Guard that only ADMIN users pass. */
export function AdminGuard(props: Omit<AuthGuardProps, 'roles'>) {
  return <AuthGuard {...props} roles={['ADMIN']} />;
}

/** Guard that ADMIN or OWNER users pass. */
export function OwnerGuard(props: Omit<AuthGuardProps, 'roles'>) {
  return <AuthGuard {...props} roles={['ADMIN', 'OWNER']} />;
}

/**
 * Render children only if the user has the given role — no redirect.
 * Useful for conditionally showing UI elements (buttons, menu items, etc.).
 *
 * @example
 * <RoleGate roles={['ADMIN']}>
 *   <DeleteButton />
 * </RoleGate>
 */
export function RoleGate({
  roles,
  children,
  fallback = null,
}: {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { user } = useAuthStore();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
