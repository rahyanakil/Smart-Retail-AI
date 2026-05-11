# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

This is the **frontend-only** git repo (`github.com/rahyanakil/Smart-Retail-AI`). The backend lives in a completely separate repo (`github.com/rahyanakil/Smart-Retail-AI-Backend`) at `../backend/` locally. They share no code, no `node_modules`, and no `package.json`. Both are deployed independently to Vercel.

## Commands

```bash
# Dev server on :3000
npm run dev

# Type-check without emitting
npm run type-check

# Lint
npm run lint

# Production build (used by Vercel)
npm run build
```

No test runner is configured.

## Architecture

### Route Groups

`src/app/` has three route groups:

- `(marketing)/` — public pages (`/`, `/about`, `/blog`, `/explore`, etc.). No auth required.
- `(auth)/` — `/login` and `/register`. Full-page gradient layout, no sidebar.
- `(dashboard)/` — all protected pages wrapped in the dashboard shell. Layout manages `mobileSidebarOpen` state and passes `isOpen`/`onClose` down to `<Sidebar>` and `onMenuClick` to `<Header>`. The dark backdrop overlay is rendered in the layout, not the sidebar.

### Middleware (`src/middleware.ts`)

Runs in the Next.js **Edge Runtime** before any React code. Reads `access_token` cookie and enforces:

- `ADMIN_ONLY_PREFIXES`: `/dashboard/stores`, `/dashboard/users`
- `OWNER_PLUS_PREFIXES`: `/dashboard/products`, `/dashboard/analytics`, `/dashboard/ai`
- `/dashboard/copilot`, `/dashboard/sales`, `/dashboard/pos` — any authenticated role
- Cashiers are redirected to `/dashboard/sales` if they try to reach owner-only routes

Uses `jose`'s `jwtVerify` (not `jsonwebtoken` — the latter doesn't run in Edge Runtime).

### Three HTTP Clients — Keep Them Separate

1. **`src/lib/api.ts`** — Axios instance. Used for all non-streaming endpoints. Has two interceptors: attaches Bearer token on every request; silently refreshes + retries on `401 TOKEN_EXPIRED`. All other 401s trigger logout.

2. **`src/context/copilot-context.tsx` and `src/hooks/use-copilot.ts`** — `fetch()` with `ReadableStream.getReader()` for SSE streaming. Axios can't stream, so the Copilot endpoints bypass the shared instance entirely.

3. **`src/app/(marketing)/explore/`** — `fetch()` for public unauthenticated requests.

**Critical:** Every place that reads `process.env.NEXT_PUBLIC_API_URL` must strip a trailing slash before constructing URLs:

```ts
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
```

This applies to all three clients. A trailing slash causes `${API_URL}/api/...` to become `//api/...`, which the backend redirects, and CORS blocks the preflight on that redirect.

### State Management

**Zustand (`src/store/authStore.ts`)** — auth only: `user`, `accessToken`, `refreshToken`, `isAuthenticated`. Persisted to `localStorage`. `setAuth` also writes `access_token` cookie for the Edge Middleware.

**Zustand (`src/store/cartStore.ts`)** — POS cart items. Not persisted (in-memory only for the session).

**TanStack Query** (`src/lib/queryClient.ts`) — all server data. `staleTime: 2min`, `gcTime: 10min`. No retry on 401/403/404. AI queries use `staleTime: 15min` to avoid repeated Gemini calls.

### Context Providers (`src/context/`)

Three contexts wrap the dashboard shell (set up in `src/app/providers.tsx` and the dashboard layout):

- `copilot-context.tsx` — Copilot chat state, message history, streaming lifecycle
- `command-palette-context.tsx` — global command palette open/close state
- `notification-context.tsx` — notification bell state

### Dark Mode

Custom `ThemeProvider` in `src/components/theme-provider.tsx` — no third-party lib. Reads `theme` from `localStorage`, resolves `'system'` via `matchMedia`, toggles `dark` class on `<html>`. Exposes `useTheme()` → `{ theme, setTheme, resolvedTheme }`.

**Recharts charts cannot use CSS `var()`** in SVG presentation attributes. Always use `useChartColors()` from `src/hooks/useChartColors.ts`, which returns explicit HSL strings based on `resolvedTheme`.

### ShadCN Components

Live in `src/components/ui/`. Never edit these manually — regenerate with `npx shadcn-ui add <component>`.

Installed: `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `skeleton`, `table`, `textarea`, `toast`.

There is **no `tabs` component** — tab-style navigation is built with button arrays and `border-b-2` active states.

Custom badge variants (`success`, `warning`, `info`, `destructive`) are in `badge.tsx` with explicit `dark:` overrides. Use opacity-based icon backgrounds (`bg-blue-500/10 dark:bg-blue-500/15`) instead of `bg-blue-50`/`bg-blue-100` which are light-mode only.

### Consistent Page Patterns

**Empty states:** `<EmptyState>` from `src/components/ui/empty-state.tsx`.

**Error states:** A `Card` with `border-destructive/30 bg-destructive/5` containing the error message and a `<Button onClick={() => refetch()}>Retry</Button>`.

**Skeletons:** Pre-built skeleton layouts live in `src/components/skeletons/` — use these rather than inline skeleton code.

## Vercel Deployment

The frontend is deployed as a Next.js app with **Root Directory = `frontend`** in the Vercel dashboard.

**Required environment variables in Vercel:**

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://smart-retail-ai-backend.vercel.app` — **no trailing slash** |
| `JWT_SECRET` | Must match the backend's `JWT_SECRET` (used by Edge Middleware for `jwtVerify`) |

The `vercel.json` at the repo root just declares `{ "framework": "nextjs" }`.

## Auth

Email/password only. No OAuth providers. The login page shows demo account quick-fill buttons (Admin / Owner / Cashier) for exploring the app without registering.

Registration always creates a `CASHIER` account — role upgrades happen via the Users page by an Owner or Admin.
