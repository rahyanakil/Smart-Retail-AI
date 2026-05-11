# SmartRetail AI — Frontend

Next.js 15 (App Router) · TypeScript · Tailwind CSS · ShadCN UI · TanStack Query · Recharts · Gemini AI

---

## The Problem This Product Solves

Independent retail store owners and managers operate in the dark. They track inventory in spreadsheets, make restock decisions by gut feel, and only discover a product ran out after a customer complains. They have no visibility into which items drive profit, no early warning for stockouts, and no way to ask a question like *"Why was last Tuesday's revenue 30% lower than the week before?"* without pulling data from three different places.

SmartRetail AI replaces that scattered, reactive workflow with a single intelligent platform. Every piece of data — sales, inventory, staff activity, and trends — flows into one dashboard, and a built-in AI layer turns that raw data into plain-language guidance the owner can act on immediately.

---

## UX Journey

### 1. Discovery & Onboarding — The Marketing Site

A potential customer lands on the public marketing site (`/`) and sees three things immediately: what the product does, who it's for, and a live demo they can try without creating an account.

The landing page leads with the core value proposition — *"Your entire retail operation, managed by AI"* — and walks through the three pain points it solves: reactive inventory management, manual sales reconciliation, and business decisions made without data.

**Key pages in this phase:**
- `/` — hero, feature highlights, social proof
- `/explore` — public product catalog preview (read-only, no login needed)
- `/about`, `/blog` — credibility and educational content
- `/faq` — pre-sale objection handling

A "Try Demo" CTA on every page drops the user into the login page with a one-click demo account fill — zero friction from interest to first experience.

---

### 2. First Login — Role-Based Entry Point

The user arrives at `/login`. Three demo accounts are shown as quick-fill buttons so they can explore every permission tier without registering:

| Demo Role | What they can access |
|---|---|
| **Admin** | Everything across all stores — system-wide view |
| **Owner** | Their store's full dashboard — analytics, AI, team management |
| **Cashier** | POS terminal and sales history only |

After login, the Edge Middleware verifies the JWT cookie and redirects to `/dashboard`. The experience from this point diverges based on role — an Owner sees AI insights front and center; a Cashier lands directly on the POS flow.

---

### 3. The Dashboard — Command Center

`/dashboard` is the first screen after login. It answers the four questions an owner asks every morning:

1. **How much did we make?** — Revenue KPI card, today vs. yesterday delta
2. **Is anything running out?** — Low stock alert count, top products by volume
3. **How is the trend?** — Revenue chart (daily/weekly/monthly toggle)
4. **What needs attention?** — Critical alerts from the AI layer

The layout adapts to the user's device: a slide-in sidebar on mobile (hamburger → sheet), fixed sidebar on desktop. A dark/light/system theme toggle is available in both the header and the Settings page.

---

### 4. Inventory Management — Prevention Before Crisis

`/dashboard/inventory` surfaces the full product catalog with three interaction modes:

**Browsing** — search by name/SKU, filter by category or stock status (In Stock / Low Stock / Out of Stock), paginated table.

**Editing** — click any product row to open an inline edit form. Price, cost, stock threshold, and category are all editable without leaving the page.

**Stock adjustment** — the Adjust Stock modal accepts three operation types:
- `ADD` — received a shipment
- `REMOVE` — damaged goods, write-off
- `SET` — counted the shelf, correcting the system

Every adjustment writes a `StockLog` row, creating a permanent audit trail the owner can review if stock numbers look wrong.

Color-coded stock badges (`success` / `warning` / `destructive`) give an at-a-glance status across the entire table without needing to read numbers.

---

### 5. Point of Sale — The Cashier's World

`/dashboard/pos` is the only page that looks nothing like the rest of the dashboard. It's designed for speed at a physical register:

- Product search with instant filtering
- Tap to add to cart, quantity controls
- Cart total updates in real-time
- One-tap checkout creates the sale atomically (stock decremented, receipt generated, sale recorded — all in a single database transaction)

Cashiers only ever see this page and `/dashboard/sales`. They cannot access analytics, AI, or inventory management — the middleware enforces this before any React code runs.

---

### 6. Sales History — Accountability & Reconciliation

`/dashboard/sales` shows every transaction with filters for date range, status (Completed / Cancelled / Refunded), and cashier. Owners use this daily to reconcile the register and spot anomalies. Cashiers use it to pull up receipts for returns.

Each sale row expands to show line items, prices at time of sale (not current price), and the receipt number.

---

### 7. Analytics — Understanding What's Actually Happening

`/dashboard/analytics` moves from *what happened* to *why it happened*.

Three charts built with Recharts (with explicit HSL colors via `useChartColors()` so they render correctly in both light and dark mode):

1. **Revenue trend** — daily/weekly/monthly toggle, the same chart the owner shows their accountant
2. **Top products by revenue** — horizontal bar chart, answers "where does my money actually come from?"
3. **Sales volume** — transaction count over time, surfaces busy periods

All numbers are scoped to the owner's store automatically — they never see data from other stores.

---

### 8. AI Insights — Proactive Business Intelligence

`/dashboard/ai` is where SmartRetail AI earns its name. On page load, three Gemini API calls fire in parallel, each grounded in live Prisma data:

**Business Health Score** — A 0–100 score with a label (Excellent / Good / Fair / Critical) calculated from inventory health, sales trends, margin performance, and operational efficiency. Displayed as an SVG donut ring. An owner who sees this drop from 82 to 61 knows something needs attention before they dig into the numbers.

**7-Day Revenue Forecast** — Three projection bands (pessimistic / expected / optimistic) for each day of the coming week, with a confidence indicator. The methodology is transparent — each row shows the underlying drivers.

**Restock Recommendations** — Sorted by urgency (Critical → High → Medium → Low). Each recommendation shows the product, current stock, days remaining at current burn rate, suggested reorder quantity, and estimated cost. The owner can scan this list in 30 seconds and place supplier orders.

**Alerts** — A sidebar of flagged risks (e.g., "3 products will be out of stock this weekend") and opportunities (e.g., "Category X is 40% up week-over-week — consider expanding selection").

Results are cached for 15 minutes (TanStack Query `staleTime`). A "Refresh All" button force-invalidates all three queries when the owner wants a fresh read.

---

### 9. AI Copilot — Conversational Business Intelligence

`/dashboard/copilot` is a chat interface that lets the owner ask any business question in plain English, with answers grounded in their live store data.

Before every response, the backend assembles a real-time context snapshot via 6 parallel database queries: today's revenue, month-to-date totals, top 5 products, inventory status, and the last 5 transactions. This snapshot is injected as the Gemini system instruction so the AI cannot hallucinate numbers — every answer reflects actual data.

The response streams token-by-token using SSE (`fetch()` + `ReadableStream`), so the owner sees words appearing immediately rather than waiting for the full answer.

**Typical questions owners ask:**
- *"What's my best-selling product this month?"*
- *"Which items should I order before the weekend?"*
- *"How does this week's revenue compare to last week?"*
- *"Which cashier processed the most sales today?"*

Conversation history persists in `sessionStorage` (capped at 40 messages) so the owner can scroll back through a session without it being sent to the backend on every message.

---

### 10. Team & Store Management — Admin Operations

**`/dashboard/users`** (Owner+) — Create team members, assign roles, deactivate accounts. New accounts default to Cashier; Owners promote them. This is how a store's team is onboarded.

**`/dashboard/stores`** (Admin only) — Multi-store operators and the platform admin manage store creation and deactivation here. Each store is an isolated tenant — its data never bleeds into another store's views.

**`/dashboard/settings`** (Any) — Profile name, password change, and the theme toggle (Light / Dark / System). Dark mode is stored in `localStorage` and resolved via `window.matchMedia` — no flash on load.

---

## Role & Permission Map

| Feature | Cashier | Owner | Admin |
|---|---|---|---|
| POS terminal | ✓ | ✓ | ✓ |
| Sales history | ✓ | ✓ | ✓ |
| AI Copilot | ✓ | ✓ | ✓ |
| Inventory management | — | ✓ | ✓ |
| Analytics | — | ✓ | ✓ |
| AI Insights | — | ✓ | ✓ |
| User management | — | ✓ | ✓ |
| Store management | — | — | ✓ |

Enforcement happens at two levels: the Next.js Edge Middleware rejects navigation before React loads, and the backend's role middleware rejects API calls regardless of the client.

---

## Quick Start

```bash
# From the project root — runs both servers concurrently
npm run dev

# Frontend only
npm run dev:frontend
```

The app runs on **http://localhost:3000**.

---

## Pages Reference

| Route | Access | Description |
|---|---|---|
| `/` | Public | Marketing landing page |
| `/explore` | Public | Read-only product catalog preview |
| `/login` | Public | Email/password login with demo account quick-fill |
| `/register` | Public | New account registration (creates Cashier role) |
| `/dashboard` | Any auth | KPI cards, revenue chart, top products, low-stock alerts |
| `/dashboard/pos` | Any auth | Point-of-sale terminal |
| `/dashboard/sales` | Any auth | Sales history with filters |
| `/dashboard/copilot` | Any auth | Streaming AI chat grounded in live store data |
| `/dashboard/inventory` | Owner+ | Product table, stock adjustment, add/edit products |
| `/dashboard/analytics` | Owner+ | Revenue trend, top products, sales volume charts |
| `/dashboard/ai` | Owner+ | Health score, 7-day forecast, restock recommendations |
| `/dashboard/users` | Owner+ | Team management — create, edit, deactivate |
| `/dashboard/settings` | Any auth | Profile, password, theme |
| `/dashboard/stores` | Admin | Multi-store management |

---

## Architecture Notes

See the [root README](../README.md) for full setup, environment variables, and monorepo commands.

### Key Design Decisions

**Edge Middleware auth** — Role guards run in Next.js Edge Runtime before any React code, using `jose` for JWT verification (compatible with the Edge, unlike `jsonwebtoken`). Users never see a flash of protected content.

**TanStack Query** — All server state. `staleTime: 2min` for most data, `staleTime: 15min` for AI results (expensive Gemini calls). No retry on 401/403/404 — those are definitive errors.

**Zustand for auth** — Persisted to `localStorage` so sessions survive page refreshes. Also writes `access_token` as a cookie so the Edge Middleware can read it without hydration.

**SSE streaming** — The Copilot page uses `fetch()` + `ReadableStream` directly instead of Axios, because Axios buffers the full response. This is the only page that doesn't go through the shared Axios instance.

**Chart colors** — Recharts SVG attributes don't support CSS `var()`. The `useChartColors()` hook reads `resolvedTheme` and returns explicit HSL strings so charts render correctly in both light and dark mode.
