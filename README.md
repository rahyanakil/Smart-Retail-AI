# SmartRetail AI — Frontend

Next.js 15 (App Router) frontend with TypeScript, Tailwind CSS, ShadCN UI, TanStack Query, and Recharts.

See the [root README](../README.md) for full project setup, prerequisites, and environment variables.

---

## Quick Start

```bash
# From the project root — runs both servers concurrently (recommended)
npm run dev

# Or just the frontend
npm run dev:frontend
# which is equivalent to:
cd frontend && npm run dev
```

The app runs on **http://localhost:3000**.

---

## Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Email/password login with demo account quick-fill |
| `/register` | Public | New account registration |
| `/dashboard` | Owner+ | KPI cards, revenue chart, top products, low stock alerts |
| `/dashboard/inventory` | Owner+ | Product table with search, category filter, stock status tabs, add/edit/adjust |
| `/dashboard/sales` | Any | POS-style sale creation + sales history table with filters |
| `/dashboard/analytics` | Owner+ | Revenue trend chart, top products chart, detailed metrics |
| `/dashboard/ai` | Owner+ | AI Insights: health score, forecast, restock recommendations, alerts |
| `/dashboard/copilot` | Any | Streaming AI chat, grounded in live store data |
| `/dashboard/users` | Owner+ | User management — create, edit, deactivate |
| `/dashboard/stores` | Admin | Store management — create, edit, delete |
| `/dashboard/settings` | Any | Profile info, theme toggle (Light/Dark/System) |

---

## Architecture

### Routing & Layout

Pages use the Next.js 15 App Router with two route groups:

- `(auth)/` — login and register, no sidebar, full-page gradient layout
- `(dashboard)/` — all protected pages, wrapped in the dashboard shell (sidebar + header)

The dashboard layout manages the mobile sidebar state (`mobileSidebarOpen`) and passes it down as props to `<Sidebar>` and `<Header>`.

### Authentication Flow

1. User submits the login form → `POST /api/auth/login`
2. Backend returns `{ user, accessToken, refreshToken }`
3. `setAuth()` in `authStore` stores both tokens in Zustand (persisted to `localStorage`) and writes `access_token` as a cookie
4. All Axios requests attach `Authorization: Bearer <accessToken>` via an interceptor
5. On `401 TOKEN_EXPIRED`, a second interceptor silently calls `POST /api/auth/refresh`, updates the stored tokens, and retries the original request
6. Any other `401` response logs the user out

### Edge Middleware (`src/middleware.ts`)

Runs in the Next.js Edge Runtime on every navigation (before React loads). Reads the `access_token` cookie and:

- Redirects unauthenticated users to `/login`
- Redirects logged-in users away from `/login` and `/register`
- Enforces role guards:
  - `/dashboard/stores`, `/dashboard/users` → Admin only
  - `/dashboard/products`, `/dashboard/analytics`, `/dashboard/ai` → Owner+
  - `/dashboard/copilot`, `/dashboard/sales` → Any authenticated role

The JWT is verified using `jose`'s `jwtVerify` (works in Edge Runtime, unlike `jsonwebtoken`).

### State Management

**Zustand (`src/store/authStore.ts`)** — auth state only: `user`, `accessToken`, `refreshToken`, `isAuthenticated`. Persisted to `localStorage` so sessions survive page refreshes.

**TanStack Query (`src/lib/queryClient.ts`)** — all server state. Default configuration:
- `staleTime: 2 minutes` — don't refetch data that was fetched in the last 2 minutes
- `gcTime: 10 minutes` — keep unused data in memory for 10 minutes
- No retry on `401`, `403`, `404`
- `refetchOnWindowFocus: false`

### API Client (`src/lib/api.ts`)

An Axios instance with two interceptors:

1. **Request interceptor** — attaches `Authorization: Bearer <accessToken>` from the Zustand store
2. **Response interceptor** — on `401 TOKEN_EXPIRED`, calls the refresh endpoint, updates stored tokens, and retries

The Copilot page is the only exception — it uses `fetch()` directly with `ReadableStream.getReader()` to consume the SSE stream token-by-token, since Axios doesn't support streaming.

---

## UI Design System

### ShadCN Components

ShadCN UI primitives live in `src/components/ui/`. Do not edit these manually — regenerate with `npx shadcn-ui add <component>`.

Installed components: `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `skeleton`, `table`, `textarea`, `toast`.

There is **no `tabs` component** — tab-style navigation is built manually with button arrays and `border-b-2` active states.

### Dark Mode

Dark mode is implemented with a custom `ThemeProvider` (`src/components/theme-provider.tsx`) — no third-party library.

**How it works:**
1. On mount, reads `theme` from `localStorage` (defaults to `'system'`)
2. Resolves to `'light'` or `'dark'` based on the stored preference or `window.matchMedia('(prefers-color-scheme: dark)')`
3. Toggles the `dark` class on `<html>` — Tailwind's `darkMode: 'class'` strategy handles the rest

**Three-way toggle** (Light / Dark / System) is in the Settings page and the header.

**`useTheme()` hook** — exposes `{ theme, setTheme, resolvedTheme }`. Use `resolvedTheme` (always `'light'` or `'dark'`) when you need to make runtime color decisions, like for charts.

### Chart Colors

Recharts SVG attributes don't support CSS `var()`. The `useChartColors()` hook (`src/hooks/useChartColors.ts`) solves this by reading `resolvedTheme` and returning explicit HSL color strings for each chart element. Use this hook whenever you render a Recharts component.

```ts
const { primary, primaryOpacity, grid, tick, barMuted } = useChartColors();
```

### Color Conventions

All semantic colors (`text-primary`, `bg-card`, `bg-muted`, `border`, etc.) are CSS variables that automatically respond to dark mode. When you need a specific color that isn't semantic (icon backgrounds, status colors):

- Use **opacity-based backgrounds**: `bg-blue-500/10 dark:bg-blue-500/15` — works over any background
- Never use `bg-blue-50` or `bg-blue-100` alone — these are light-mode only

### Badge Variants

Custom badge variants beyond ShadCN's defaults:

| Variant | Use case |
|---|---|
| `success` | Active, in stock, completed |
| `warning` | Low stock, pending |
| `info` | Informational |
| `destructive` | Errors, out of stock, cancelled |

All variants have explicit `dark:` overrides for text and background.

### Empty States

Use the `<EmptyState>` component (`src/components/ui/empty-state.tsx`) consistently:

```tsx
<EmptyState
  icon={Package}
  title="No products yet"
  description="Add your first product to start tracking inventory."
  action={<Button onClick={...}>Add Product</Button>}
/>
```

### Error States

Every page that fetches data shows an error card with a retry button on failure:

```tsx
{isError && (
  <Card className="border-destructive/30 bg-destructive/5">
    <CardContent className="flex items-center justify-between py-4 px-5">
      <p className="text-sm text-destructive">Failed to load data.</p>
      <Button size="sm" variant="outline" onClick={() => refetch()}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
        Retry
      </Button>
    </CardContent>
  </Card>
)}
```

---

## Responsive Design

The layout adapts across three breakpoints:

| Breakpoint | Sidebar | Table columns | Grid |
|---|---|---|---|
| Mobile (`< 768px`) | Hidden, slides in via hamburger button | Minimal — only essential columns | Single column |
| Tablet (`768px–1024px`) | Visible, fixed | Most columns | 2 columns |
| Desktop (`> 1024px`) | Visible, fixed | All columns | 3–4 columns |

**Mobile sidebar** — uses a slide-in animation (`transition-transform duration-300`) with a dark backdrop overlay. Tapping any nav link or the backdrop closes it.

**Responsive tables** — columns are progressively hidden:
- `hidden sm:table-cell` — hidden on mobile only
- `hidden md:table-cell` — hidden on mobile + tablet
- `hidden lg:table-cell` — hidden below desktop

**Page max-width** — most pages use `max-w-[1600px] mx-auto` so they don't stretch too wide on ultra-wide monitors.

---

## AI Features

### AI Insights Page (`/dashboard/ai`)

On page load, three TanStack Query requests fire in parallel:

```ts
useQuery({ queryKey: ['ai-insights'], staleTime: 1000 * 60 * 15 })
useQuery({ queryKey: ['ai-forecast'], staleTime: 1000 * 60 * 15 })
useQuery({ queryKey: ['ai-restock'], staleTime: 1000 * 60 * 15 })
```

`staleTime: 15 minutes` — returning to the page within 15 minutes uses the cached result, not a new Gemini API call. The "Refresh All" button calls `queryClient.invalidateQueries` on all three keys to force a fresh analysis.

The page renders:
- **Health ring** — SVG donut chart showing the business health score (0–100)
- **Quick KPIs** — health score, forecast revenue, items at risk, opportunities count
- **Weekly forecast table** — 7-day revenue projections with confidence badges
- **Restock recommendations** — sorted by urgency, with estimated reorder cost
- **Alerts sidebar** — critical stock items + risks and opportunities

### AI Copilot Page (`/dashboard/copilot`)

Uses `fetch()` + `ReadableStream` to consume Server-Sent Events token by token. Each token appended to the streaming message triggers a React state update, so text appears character-by-character.

Conversation history is kept in `sessionStorage` under `smartretail-copilot-history` and capped at 40 messages. Only the last 20 messages are sent to the API to stay within context limits.

Features: auto-scroll during streaming, copy-to-clipboard on hover, stop generation button, session-persistent history, suggested questions.

---

## Development Commands

```bash
# Start dev server
npm run dev

# Type-check (no emit)
npm run type-check

# Lint
npm run lint

# Production build
npm run build
```
