import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Terms of Service — SmartRetail AI',
  description: 'Terms governing your use of SmartRetail AI services.',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: [
      'By creating an account or using SmartRetail AI, you agree to these Terms of Service and our Privacy Policy.',
      'If you are using SmartRetail AI on behalf of a business, you represent that you have the authority to bind that business to these terms.',
    ],
  },
  {
    title: '2. Description of Service',
    content: [
      'SmartRetail AI provides a cloud-based retail management platform including point-of-sale, inventory management, analytics, and AI-powered insights.',
      'The service requires an internet connection and a modern web browser. We do not guarantee uninterrupted availability.',
    ],
  },
  {
    title: '3. Account Responsibilities',
    content: [
      'You are responsible for maintaining the security of your account credentials. Do not share your password.',
      'You are responsible for all activity that occurs under your account.',
      'You must notify us immediately at security@smartretailai.com if you suspect unauthorized access.',
    ],
  },
  {
    title: '4. Acceptable Use',
    content: [
      'You may not use SmartRetail AI for illegal activities, to process fraudulent transactions, or to store prohibited content.',
      'You may not attempt to reverse engineer, decompile, or extract the source code of the platform.',
      'Automated scraping or bulk data extraction without our written consent is prohibited.',
    ],
  },
  {
    title: '5. Your Data',
    content: [
      'You retain ownership of all business data you enter into SmartRetail AI (products, sales, customer data).',
      'By using AI features, you grant SmartRetail AI the right to send anonymized subsets of your data to Google Gemini API for processing.',
      'We do not sell your data to third parties. See our Privacy Policy for full details.',
    ],
  },
  {
    title: '6. Payment and Billing',
    content: [
      'Paid plans are billed monthly in advance. Prices are in USD unless otherwise stated.',
      'We reserve the right to change prices with 30 days advance notice.',
      'Refunds are not provided for partial months, but you may cancel at any time.',
    ],
  },
  {
    title: '7. Limitation of Liability',
    content: [
      'SmartRetail AI is provided "as is." We make no warranties about accuracy, reliability, or fitness for a particular purpose.',
      'Our total liability to you shall not exceed the amount you paid to us in the 12 months preceding the claim.',
      'We are not liable for lost revenue, lost data, or indirect damages arising from your use of the platform.',
    ],
  },
  {
    title: '8. Termination',
    content: [
      'Either party may terminate the service agreement at any time.',
      'Upon termination, your access to the platform ceases. Your data is retained for 90 days and then deleted.',
      'We may suspend accounts that violate these terms without prior notice.',
    ],
  },
  {
    title: '9. Governing Law',
    content: [
      'These terms are governed by the laws of the State of California, USA, without regard to conflict of law principles.',
      'Disputes will be resolved through binding arbitration in San Francisco, CA, except where prohibited by applicable law.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="pt-20">
      <section className="py-12 text-center max-w-3xl mx-auto px-4 sm:px-6">
        <Badge variant="secondary" className="mb-4">Legal</Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated: May 1, 2025</p>
      </section>

      <div className="pb-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-8 space-y-10">
          <p className="text-muted-foreground leading-relaxed">
            Please read these Terms of Service carefully before using SmartRetail AI.
            If you have questions, contact us at{' '}
            <a href="mailto:legal@smartretailai.com" className="text-primary hover:underline underline-offset-4">
              legal@smartretailai.com
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
          Questions?{' '}
          <Link href="/contact" className="text-primary hover:underline underline-offset-4">
            Contact us
          </Link>{' '}
          or read our{' '}
          <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
