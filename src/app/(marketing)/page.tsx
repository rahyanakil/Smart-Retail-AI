'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Zap, BarChart3, Package, ShoppingCart,
  Brain, Store, TrendingUp, Users, Shield, CheckCircle,
  Star, ChevronDown, ChevronUp, Sparkles, RefreshCw,
  Bot, LineChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Animated counter ─────────────────────────────────────────────────────────

function useCounter(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);

  return { count, ref };
}

// ─── FAQ accordion ────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'What AI features does SmartRetail AI include?',
    a: 'SmartRetail AI includes four core AI capabilities powered by Google Gemini: 30-day Sales Forecasting with weekly confidence levels, Business Health Insights with a real-time score, Intelligent Restock Recommendations to prevent stockouts, and Customer Behavior Analysis for peak hours and purchase patterns. Plus an always-on AI Copilot you can chat with about any aspect of your store.',
  },
  {
    q: 'Is there a free plan available?',
    a: 'Yes. Our Starter plan is completely free and includes one store location, up to 100 products, a full POS system, and basic sales analytics. No credit card required to sign up. When you\'re ready to scale, upgrading to Business unlocks AI features, unlimited products, and multi-store support.',
  },
  {
    q: 'Can I manage multiple store locations?',
    a: 'Absolutely. SmartRetail AI is built from the ground up for multi-location retail. The Business plan supports up to 5 stores, and the Enterprise plan is unlimited. Each store has its own inventory, staff, and sales data, with a unified Admin dashboard for cross-store reporting.',
  },
  {
    q: 'How does the AI Copilot work?',
    a: 'The AI Copilot is a conversational assistant with live access to your store data. It pulls real-time inventory levels, sales figures, top products, and recent transactions before each conversation so it can answer questions like "What\'s my best-selling product this month?" or "Which items are about to run out?" It\'s powered by Google Gemini and streams responses token by token.',
  },
  {
    q: 'Is my business data secure?',
    a: 'Yes. All data is encrypted in transit (TLS 1.3) and at rest. We use Neon PostgreSQL with row-level security, JWT authentication with short-lived access tokens, and refresh token rotation. Passwords are hashed with bcrypt. We never store payment card data — SmartRetail AI tracks payment methods (cash, card, digital wallet) but not card numbers.',
  },
  {
    q: 'What kind of support is available?',
    a: 'Starter users have access to our documentation and community forum. Business plan users get priority email support with a 24-hour response SLA. Enterprise customers receive a dedicated success manager and phone support. All plans have access to our in-app AI Copilot, which can answer most product questions instantly.',
  },
  {
    q: 'How quickly can I get started?',
    a: 'You can have your store running in under 10 minutes. Sign up, choose your plan, name your store, and start adding products. The POS is ready to process sales immediately. No hardware required — SmartRetail AI runs entirely in the browser on any device.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 hover:text-primary transition-colors"
      >
        <span className="text-sm font-medium">{q}</span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'Lightning-Fast POS',
    description: 'Process sales in seconds with barcode scanning, automatic stock updates, and instant digital receipts.',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    icon: Package,
    title: 'Smart Inventory',
    description: 'Real-time stock tracking with AI-powered reorder alerts before you run out, not after.',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  {
    icon: Brain,
    title: 'AI Business Intelligence',
    description: 'Gemini AI analyzes your data and surfaces actionable insights, forecasts, and a live business health score.',
    color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Beautiful charts, exportable reports, and trend analysis to make every decision data-driven.',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Store,
    title: 'Multi-Store Management',
    description: 'Control all your locations from one unified dashboard with role-based access for your team.',
    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  },
  {
    icon: Bot,
    title: '24/7 AI Copilot',
    description: 'Ask anything about your store in natural language. The Copilot has live access to all your data.',
    color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  },
];

const AI_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Sales Forecasting',
    description: 'Get a 30-day revenue forecast with weekly confidence levels based on your historical patterns.',
    badge: 'Gemini AI',
  },
  {
    icon: Sparkles,
    title: 'Business Health Score',
    description: 'A real-time 0–100 score with prioritized actions: what to fix, what to double down on.',
    badge: 'Live Data',
  },
  {
    icon: RefreshCw,
    title: 'Restock Intelligence',
    description: 'Know when to reorder, how much, and what it will cost — before stockouts hurt your sales.',
    badge: 'Proactive',
  },
  {
    icon: LineChart,
    title: 'Customer Behavior',
    description: 'Understand peak hours, top categories, and payment patterns to optimize your operations.',
    badge: 'Insights',
  },
];

const TESTIMONIALS = [
  {
    quote: 'SmartRetail AI transformed how we manage our 3 stores. The restock recommendations alone saved us from multiple stockouts last quarter.',
    name: 'Sarah Chen',
    title: 'Owner · TechGadgets Pro',
    initials: 'SC',
    rating: 5,
  },
  {
    quote: 'I ask the AI Copilot anything about my store data and get instant answers. It\'s like having a business analyst on call 24/7 without the cost.',
    name: 'Marcus Thompson',
    title: 'Manager · FreshMart Downtown',
    initials: 'MT',
    rating: 5,
  },
  {
    quote: 'The sales forecasts are genuinely accurate. We planned our holiday stock perfectly this year. We saw 34% higher revenue with zero stockouts.',
    name: 'Priya Kapoor',
    title: 'Owner · StyleBoutique',
    initials: 'PK',
    rating: 5,
  },
];

const PRICING = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    description: 'Perfect for single-location retailers getting started.',
    features: [
      '1 store location',
      'Up to 100 products',
      'Full POS system',
      'Basic sales analytics',
      '30-day data retention',
      'Community support',
    ],
    cta: 'Start for free',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Business',
    price: '$49',
    period: 'per month',
    description: 'For growing retailers who need AI-powered insights.',
    features: [
      'Up to 5 store locations',
      'Unlimited products',
      'All AI features (5 tools)',
      'Advanced analytics & exports',
      '1-year data retention',
      'Priority email support',
    ],
    cta: 'Start 14-day trial',
    href: '/register',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'For large retailers with complex requirements.',
    features: [
      'Unlimited store locations',
      'Custom AI model tuning',
      'API access & webhooks',
      'SSO & advanced security',
      'Unlimited data retention',
      'Dedicated success manager',
    ],
    cta: 'Contact sales',
    href: '/contact',
    highlighted: false,
  },
];

const BRANDS = ['TechGadgets Pro', 'FreshMart', 'StyleBoutique', 'BookNook', 'GadgetPro', 'NovaMart'];

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCounter(value);
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold tabular-nums">
        <span ref={ref}>{count.toLocaleString()}</span>
        <span className="text-primary">{suffix}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="overflow-x-hidden">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[65vh] flex items-center pt-20 pb-16 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-violet-500/6 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="secondary" className="mb-5 gap-1.5">
                <Sparkles className="h-3 w-3" />
                Powered by Google Gemini AI
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                The Smartest{' '}
                <span className="text-primary">Retail Platform.</span>{' '}
                Period.
              </h1>
              <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-xl">
                AI-powered inventory management, point of sale, and business intelligence — all in
                one beautiful dashboard trusted by 500+ retail businesses worldwide.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button size="lg" asChild className="text-base h-12 px-6">
                  <Link href="/register">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-6">
                  <Link href="/login">
                    View live demo
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-5 mt-8 text-sm text-muted-foreground">
                {['No credit card required', 'Free plan available', '5-min setup'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full max-w-md mx-auto">
                {/* Main card */}
                <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/50" />
                    </div>
                    <span className="ml-1 text-xs text-muted-foreground">SmartRetail AI — Dashboard</span>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-primary/10 p-3.5 border border-primary/10">
                      <div className="text-xs text-muted-foreground">Today's Revenue</div>
                      <div className="text-xl font-bold text-primary mt-1">$3,842</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> +12.4% vs yesterday
                      </div>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3.5">
                      <div className="text-xs text-muted-foreground">Orders Today</div>
                      <div className="text-xl font-bold mt-1">127</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> +8.1%
                      </div>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3.5">
                      <div className="text-xs text-muted-foreground">Products</div>
                      <div className="text-xl font-bold mt-1">284</div>
                      <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">18 low stock</div>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/10">
                      <div className="text-xs text-muted-foreground">AI Health Score</div>
                      <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">87/100</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Excellent</div>
                    </div>
                  </div>
                  <div className="px-4 pb-4">
                    <div className="text-xs text-muted-foreground mb-2">Monthly goal progress</div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-[65%] rounded-full bg-primary transition-all" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5">65% complete — $6,150 of $9,500</div>
                  </div>
                </div>

                {/* Floating AI alert */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-4 -right-6 rounded-xl bg-card border border-border shadow-lg p-3 flex items-start gap-2.5 text-xs max-w-[180px]"
                >
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <div className="font-semibold">AI Restock Alert</div>
                    <div className="text-muted-foreground mt-0.5">iPhone Cases: 3 left. Order 50 units.</div>
                  </div>
                </motion.div>

                {/* Floating mini chart */}
                <motion.div
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-5 -left-6 rounded-xl bg-card border border-border shadow-lg p-3 text-xs"
                >
                  <div className="text-muted-foreground mb-2">Weekly sales</div>
                  <div className="flex items-end gap-1 h-10">
                    {[35, 60, 42, 78, 52, 91, 68].map((h, i) => (
                      <div
                        key={i}
                        className="w-4 rounded-sm bg-primary/70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
              Trusted by 500+ retailers
            </span>
            <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-2">
              {BRANDS.map((brand) => (
                <span key={brand} className="text-sm font-semibold text-muted-foreground/70">
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <StatCard value={500} suffix="+" label="Active Stores" />
            <StatCard value={12} suffix="M+" label="Revenue Managed ($)" />
            <StatCard value={50} suffix="K+" label="Products Tracked" />
            <StatCard value={99} suffix=".9%" label="System Uptime" />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to run a smarter store
            </h2>
            <p className="mt-4 text-muted-foreground">
              From the moment a customer walks in to the insights you review at end of day,
              SmartRetail AI has every step covered.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="rounded-xl border border-border bg-card p-6 hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-4', feature.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Up and running in under 10 minutes
            </h2>
            <p className="mt-4 text-muted-foreground">
              No hardware. No installation. Just sign up and start selling.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Users,
                title: 'Create your account',
                description: 'Sign up, configure your store details, and invite your team with role-based permissions. Takes less than 5 minutes.',
              },
              {
                step: '02',
                icon: Package,
                title: 'Add your products',
                description: 'Import your catalog or add products manually. Set prices, stock levels, and low-stock alerts. Your POS is ready immediately.',
              },
              {
                step: '03',
                icon: Brain,
                title: 'Let AI work for you',
                description: 'As you sell, AI continuously learns your patterns. Get forecasts, restock alerts, and insights — all automatically.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: i * 0.12 }}
                  className="relative"
                >
                  {i < 2 && (
                    <div className="hidden md:block absolute top-6 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px border-t-2 border-dashed border-border" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI Features showcase ───────────────────────────────────────────── */}
      <section id="ai-features" className="py-16 sm:py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 gap-1.5">
                <Sparkles className="h-3 w-3" />
                AI-Powered
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Four AI tools that think ahead so you don't have to
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Every AI feature is powered by Google Gemini and built on your live store data.
                No generic advice — only insights that are specific to your products, your sales, and your customers.
              </p>
              <Button className="mt-8" asChild>
                <Link href="/login">
                  See AI in action
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {AI_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.35, delay: i * 0.08 }}
                    className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {feature.badge}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-sm mb-1.5">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Retailers love SmartRetail AI
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 flex flex-col"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={cn(
                  'rounded-xl border bg-card p-7 flex flex-col relative',
                  plan.highlighted
                    ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20'
                    : 'border-border'
                )}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-sm">
                    {plan.badge}
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="font-semibold text-base mb-1">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-8 w-full"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          <div className="rounded-xl border border-border bg-card px-6 divide-y divide-border">
            {FAQ_ITEMS.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Still have questions?{' '}
            <Link href="/contact" className="text-primary hover:underline underline-offset-4">
              Contact our team
            </Link>
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">
            Ready to transform your retail business?
          </h2>
          <p className="mt-4 text-primary-foreground/80 text-lg">
            Join 500+ retailers who use SmartRetail AI to sell smarter every day.
            Start free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Button
              size="lg"
              variant="secondary"
              className="text-base h-12 px-8"
              asChild
            >
              <Link href="/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="text-base h-12 px-8 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/contact">Talk to sales</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
