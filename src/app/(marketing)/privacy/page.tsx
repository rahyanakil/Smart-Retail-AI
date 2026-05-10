import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Privacy Policy — SmartRetail AI',
  description: 'How SmartRetail AI collects, uses, and protects your business data.',
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: [
      'Account information: Your name, email address, and password (hashed with bcrypt, never stored in plain text).',
      'Business data: Product catalog, inventory levels, sales transactions, and store configuration you enter into SmartRetail AI.',
      'Usage data: Pages visited, features used, and interaction logs collected for product improvement.',
      'Technical data: IP address, browser type, device identifiers, and error logs used to maintain system stability.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      'To provide and improve the SmartRetail AI platform, including AI-powered features that analyze your business data.',
      'To send transactional emails (account creation, password reset) and, with your consent, product update emails.',
      'To diagnose and fix technical issues, and to monitor service reliability.',
      'We do not sell your personal information to third parties. Ever.',
    ],
  },
  {
    title: '3. AI Features and Your Data',
    content: [
      'SmartRetail AI uses Google Gemini AI to power features like Sales Forecasting, Business Insights, Restock Recommendations, and the AI Copilot.',
      'When you use an AI feature, a prompt containing your anonymized store data is sent to the Gemini API. This data includes aggregated sales figures, product names and stock levels, and transaction patterns.',
      'We do not send customer personal data (names, contact info, payment card numbers) to any AI provider. We do not store or log AI conversation history beyond your current browser session.',
      'Google\'s data handling is governed by Google\'s API Terms of Service and Privacy Policy.',
    ],
  },
  {
    title: '4. Data Storage and Security',
    content: [
      'Your data is stored in Neon PostgreSQL, a managed cloud database with encryption at rest and automated backups.',
      'All data transmission uses TLS 1.3 encryption. Authentication uses short-lived JWT access tokens (1-day expiry) and rotating refresh tokens (7-day expiry).',
      'We implement role-based access control so that each user can only access data appropriate to their role (Cashier, Owner, Admin).',
      'In the event of a data breach that affects your personal information, we will notify affected users within 72 hours.',
    ],
  },
  {
    title: '5. Data Retention',
    content: [
      'Active accounts: Your data is retained for the duration of your subscription.',
      'Cancelled accounts: Data is retained for 90 days after cancellation, giving you time to export. After 90 days, data is permanently deleted.',
      'You can request a full export of your data at any time by contacting support.',
    ],
  },
  {
    title: '6. Your Rights',
    content: [
      'Access: Request a copy of all personal data we hold about you.',
      'Correction: Update inaccurate information via your account settings or by contacting us.',
      'Deletion: Request deletion of your account and all associated data.',
      'Portability: Receive your data in a structured, machine-readable format (CSV).',
      'To exercise any of these rights, contact us at privacy@smartretailai.com.',
    ],
  },
  {
    title: '7. Cookies',
    content: [
      'We use a single authentication cookie (access_token) to maintain your login session. This is a strictly necessary cookie and cannot be disabled without signing out.',
      'We do not use third-party advertising cookies or cross-site tracking.',
    ],
  },
  {
    title: '8. Changes to This Policy',
    content: [
      'We will notify you by email at least 30 days before making material changes to this privacy policy.',
      'Continued use of SmartRetail AI after the effective date constitutes acceptance of the updated policy.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-20">
      <section className="py-12 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <Badge variant="secondary" className="mb-4">Legal</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: May 1, 2025</p>
      </section>

      <div className="pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-8 space-y-10">
          <p className="text-muted-foreground leading-relaxed">
            SmartRetail AI (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is committed to protecting your privacy.
            This policy explains what data we collect, how we use it, and your rights over it.
            If you have questions, contact us at{' '}
            <a href="mailto:privacy@smartretailai.com" className="text-primary hover:underline underline-offset-4">
              privacy@smartretailai.com
            </a>.
          </p>

          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-base font-semibold mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Questions about this policy?{' '}
          <Link href="/contact" className="text-primary hover:underline underline-offset-4">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
