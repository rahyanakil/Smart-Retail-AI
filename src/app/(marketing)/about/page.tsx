import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Target, Zap, Heart, Shield, Users, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — SmartRetail AI',
  description: 'Learn about our mission to bring AI-powered retail management to every store, large or small.',
};

const TEAM = [
  {
    name: 'Alexandra Reid',
    role: 'Co-Founder & CEO',
    bio: '12 years in retail operations. Previously VP of Retail Tech at a Fortune 500. Built SmartRetail AI after experiencing firsthand how outdated most POS systems are.',
    initials: 'AR',
    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Daniel Torres',
    role: 'Co-Founder & CTO',
    bio: 'Full-stack engineer and AI researcher. Formerly at Google DeepMind. Leads the Gemini AI integration and backend architecture.',
    initials: 'DT',
    bg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  {
    name: 'Maya Patel',
    role: 'Head of Product',
    bio: 'UX designer turned product leader. Spent 8 years designing enterprise software. Obsessed with making complex workflows feel simple.',
    initials: 'MP',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'James Okonkwo',
    role: 'Head of Customer Success',
    bio: 'Spent a decade helping retailers adopt new technology. Knows every pain point in retail operations by name.',
    initials: 'JO',
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
];

const VALUES = [
  {
    icon: Target,
    title: 'Customer-first, always',
    description: 'Every feature we build solves a real problem for a real retailer. We talk to customers every week and ship based on what actually matters.',
  },
  {
    icon: Zap,
    title: 'Speed and simplicity',
    description: 'Retail is fast. Your tools should be faster. We obsess over every millisecond of load time and every unnecessary click we can eliminate.',
  },
  {
    icon: Heart,
    title: 'Honesty over hype',
    description: 'We tell you what AI can and cannot do. We show you confidence levels on forecasts. We never pretend certainty we don\'t have.',
  },
  {
    icon: Shield,
    title: 'Security by default',
    description: 'Your sales data and inventory numbers are your competitive advantage. We treat protecting them as a non-negotiable, not a feature.',
  },
];

const MILESTONES = [
  { year: '2022', event: 'SmartRetail AI founded in San Francisco after the team spent a year in retail stores learning what was broken.' },
  { year: '2023 Q1', event: 'First 50 beta stores onboarded. POS and inventory core launched.' },
  { year: '2023 Q3', event: 'Google Gemini AI integration goes live. Sales forecasting and copilot shipped.' },
  { year: '2024', event: 'Reached 200 active stores. Business Insights, Restock AI, and Customer Behavior analysis added.' },
  { year: '2025', event: '500+ stores. $12M+ revenue managed. Multi-store management and advanced analytics released.' },
];

export default function AboutPage() {
  return (
    <div className="pt-20">

      {/* Hero */}
      <section className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge variant="secondary" className="mb-5">Our Story</Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
          We built the tool we wished existed
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          SmartRetail AI started with a simple observation: retail store owners are incredibly
          resourceful, but they're fighting with software from the 2000s. We set out to change that.
        </p>
      </section>

      {/* Mission */}
      <section className="py-16 bg-muted/20 border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4">Mission</Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                AI-powered retail management for every store, not just the Fortune 500
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Large chains have had access to sophisticated inventory intelligence and
                demand forecasting for years. Independent retailers are left with basic
                spreadsheets and gut feel. We exist to close that gap.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                SmartRetail AI brings the same quality of AI-driven insights to a three-store
                boutique that Fortune 500 retailers have — at a price that makes sense for a
                small business.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, label: '500+', sub: 'Active Stores' },
                { icon: TrendingUp, label: '$12M+', sub: 'Revenue Managed' },
                { icon: Zap, label: '99.9%', sub: 'Uptime SLA' },
                { icon: Heart, label: '4.9/5', sub: 'Customer Rating' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={sub} className="rounded-xl border border-border bg-card p-5 text-center">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Values</Badge>
          <h2 className="text-3xl font-bold tracking-tight">What we believe</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-xl border border-border bg-card p-6">
                <Icon className="h-6 w-6 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-muted/20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">The Team</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Who we are</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-lg font-bold mb-4 ${member.bg}`}>
                  {member.initials}
                </div>
                <h3 className="font-semibold text-sm">{member.name}</h3>
                <p className="text-xs text-primary mt-0.5 mb-3">{member.role}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 sm:py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Timeline</Badge>
          <h2 className="text-3xl font-bold tracking-tight">Our journey so far</h2>
        </div>
        <div className="relative pl-8 space-y-8">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
          {MILESTONES.map((m) => (
            <div key={m.year} className="relative">
              <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
              <div className="text-xs font-semibold text-primary mb-1">{m.year}</div>
              <p className="text-sm text-muted-foreground">{m.event}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border bg-muted/20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Join us in reimagining retail</h2>
          <p className="text-muted-foreground mb-6">
            Start with our free plan and see why 500+ retailers trust SmartRetail AI.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Get started free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

    </div>
  );
}
