'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, Role } from '@/types';

// ─── Cookie sync ──────────────────────────────────────────────────────────────
// Next.js middleware runs in the Edge Runtime and can only read Request cookies,
// not localStorage. We mirror the access token into a client-writable cookie
// so the middleware can gate /dashboard routes server-side before React loads.

const COOKIE_NAME = 'access_token';
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 1 day in seconds (matches JWT_EXPIRES_IN)

function setCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = [
    `${COOKIE_NAME}=${token}`,
    'path=/',
    'SameSite=Lax',
    `max-age=${ACCESS_TOKEN_MAX_AGE}`,
    // Do NOT add HttpOnly — this cookie is set by client JS, so HttpOnly would
    // prevent that. Server-set HttpOnly cookies require a Set-Cookie response header.
  ].join('; ');
}

function clearCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; SameSite=Lax; max-age=0`;
}

// ─── State types ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean; // true after Zustand rehydrates from localStorage

  // Mutators
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setHydrated: () => void;
  logout: () => void;

  // Selectors
  hasRole: (role: Role) => boolean;
  hasAnyRole: (...roles: Role[]) => boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        setCookie(accessToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        // Called by the axios interceptor after a silent token refresh
        setCookie(accessToken);
        set({ accessToken, refreshToken });
      },

      setUser: (user) => set({ user }),

      setHydrated: () => set({ isHydrated: true }),

      logout: () => {
        clearCookie();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      hasRole: (role: Role) => get().user?.role === role,

      hasAnyRole: (...roles: Role[]) => {
        const userRole = get().user?.role;
        return userRole ? roles.includes(userRole) : false;
      },
    }),
    {
      name: 'smartretail-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, re-sync cookie in case browser cleared it
        if (state?.accessToken) setCookie(state.accessToken);
        state?.setHydrated();
      },
    }
  )
);
