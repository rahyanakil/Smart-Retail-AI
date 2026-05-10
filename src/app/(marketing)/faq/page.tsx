'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FAQ_CATEGORIES = [
  {
    category: 'Getting Started',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Click "Get started free" on the homepage, enter your name, email, and a password. No credit card required. You\'ll be assigned the Cashier role by default. Ask your store owner or admin to upgrade your permissions if needed.',
      },
      {
        q: 'How quickly can I process my first sale?',
        a: 'Once you have products in your inventory, you can process a sale immediately. Open the POS, search or scan a product, add it to the cart, enter the payment method, and complete checkout. The whole process takes seconds.',
      },
      {
        q: 'Does SmartRetail AI work on mobile devices?',
        a: 'Yes. SmartRetail AI is fully responsive and works on tablets and smartphones. The POS system is especially well-suited to tablet use. No native app installation is required — it runs entirely in the browser.',
      },
      {
        q: 'Is there a minimum contract or commitment?',
        a: 'No. The free Starter plan has no time limit. Paid plans are billed monthly with no annual commitment required. You can cancel at any time from your account settings.',
      },
    ],
  },
  {
    category: 'AI Features',
    items: [
      {
        q: 'What AI features are included in each plan?',
        a: 'AI features (Sales Forecasting, Business Insights, Restock Recommendations, Customer Behavior Analysis, and the AI Copilot) are available on the Business plan and above. The Starter plan includes the core POS and basic analytics without AI.',
      },
      {
        q: 'How accurate are the AI forecasts?',
        a: 'Accuracy improves with more sales history. With 30+ days of data, forecasts are typically within 15–20% of actual results. Each forecast includes a confidence level (high, medium, low) so you know how much to rely on each prediction.',
      },
      {
        q: 'Does the AI Copilot have access to all my store data?',
        a: 'Yes. Before each conversation, the Copilot pulls a live snapshot of your store: today\'s revenue and orders, monthly performance, inventory levels, top products, and recent sales. It uses this context to answer questions specific to your business.',
      },
      {
        q: 'Can the AI make purchases or change settings on my behalf?',
        a: 'No. The AI Copilot is read-only — it surfaces insights and answers questions, but it cannot place orders, edit products, or change any settings. All actions require a human to confirm.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    items: [
      {
        q: 'Can I change plans at any time?',
        a: 'Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at the start of the next billing cycle. When downgrading, your data is retained but some features may become inaccessible.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), as well as PayPal. Enterprise customers can pay by invoice.',
      },
      {
        q: 'Is there a discount for annual billing?',
        a: 'Yes. Switching to annual billing saves 20% compared to monthly. Contact our sales team or visit your billing settings to make the switch.',
      },
    ],
  },
  {
    category: 'Security & Data',
    items: [
      {
        q: 'Where is my data stored?',
        a: 'All data is stored in Neon PostgreSQL, a fully managed cloud database with automatic backups, point-in-time recovery, and encryption at rest. Data is stored in US-East data centers by default.',
      },
      {
        q: 'Can I export my data?',
        a: 'Yes. From the Analytics section, you can export sales reports and product data as CSV. Full data export for account migration is available on request.',
      },
      {
        q: 'What happens to my data if I cancel?',
        a: 'Your data is retained for 90 days after cancellation, giving you time to export anything you need. After 90 days, data is permanently deleted. You\'ll receive a reminder email before deletion.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between py-4 gap-4 text-left hover:text-primary transition-colors"
      >
        <span className="text-sm font-medium">{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        }
      </button>
      {open && (
        <div className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [search, setSearch] = useState('');

  const filtered = FAQ_CATEGORIES.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        !search ||
        item.q.toLowerCase().includes(search.toLowerCase()) ||
        item.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="py-16 sm:py-20 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <Badge variant="secondary" className="mb-4">FAQ</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Find answers to the most common questions about SmartRetail AI.
        </p>
        <div className="max-w-md mx-auto">
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11"
          />
        </div>
      </section>

      {/* FAQ content */}
      <section className="pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No questions match your search. Try different keywords or{' '}
            <Link href="/contact" className="text-primary hover:underline underline-offset-4">
              contact us directly
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((cat) => (
              <div key={cat.category}>
                <h2 className="text-base font-semibold mb-1 text-primary">{cat.category}</h2>
                <div className="rounded-xl border border-border bg-card px-6">
                  {cat.items.map((item) => (
                    <FAQItem key={item.q} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Still need help */}
        <div className="mt-12 rounded-xl border border-border bg-muted/30 p-6 flex flex-col sm:flex-row items-center gap-4">
          <MessageSquare className="h-8 w-8 text-primary shrink-0" />
          <div className="text-center sm:text-left flex-1">
            <p className="font-semibold text-sm">Still have questions?</p>
            <p className="text-sm text-muted-foreground">
              Our team responds to every message within 24 business hours.
            </p>
          </div>
          <Button asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
